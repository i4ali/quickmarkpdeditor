// Simplified webhook - No database, uses JWT tokens
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const getRawBody = async (req) => {
  if (typeof req.body === 'string') {
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString('utf8');
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
};

// Email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendLicenseEmail(email, licenseKey) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🎉 Your QuickMark PDF Premium License',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Welcome to QuickMark PDF Premium!</h1>
        <p>Thank you for your purchase!</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Your License Key:</h2>
          <p style="font-size: 18px; font-weight: bold; color: #333; word-break: break-all; font-family: monospace;">
            ${licenseKey}
          </p>
        </div>

        <h3>How to activate:</h3>
        <ol>
          <li>Open QuickMark PDF extension</li>
          <li>Click any premium feature</li>
          <li>Click "Activate License Key"</li>
          <li>Paste your license key above</li>
          <li>Enjoy all premium features forever!</li>
        </ol>

        <p style="margin-top: 30px; color: #666;">
          Questions? Reply to this email.
        </p>
      </div>
    `
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_email || session.customer_details?.email;

    console.log('Processing checkout for:', email);

    if (!email) {
      console.error('No email found in session');
      return res.status(200).json({ received: true, error: 'No email' });
    }

    try {
      // Generate JWT license key (no database needed!)
      const licenseKey = jwt.sign(
        {
          email: email,
          product: 'quickmark_pdf_premium',
          purchaseDate: new Date().toISOString(),
          stripeSessionId: session.id
        },
        process.env.JWT_SECRET,
        { expiresIn: '100y' } // Lifetime license
      );

      console.log('License key generated for:', email);

      // Send email
      await sendLicenseEmail(email, licenseKey);

      console.log('✅ License email sent successfully to:', email);
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      return res.status(500).json({ received: true, error: error.message });
    }
  }

  res.status(200).json({ received: true });
};
