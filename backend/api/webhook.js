// Vercel Serverless Function
// Handles Stripe webhook events and generates license keys

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { saveLicense, sendLicenseEmail } = require('../utils/database');

// Disable body parsing, need raw body for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read raw body
const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
};

// Generate license key
function generateLicenseKey() {
  const segment = () => {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  };
  return `QMPDF-${segment()}-${segment()}-${segment()}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const rawBody = await getRawBody(req);

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Generate license key
      const licenseKey = generateLicenseKey();
      const customerEmail = session.customer_email || session.customer_details?.email;

      // Save to database
      await saveLicense({
        licenseKey,
        email: customerEmail,
        stripeSessionId: session.id,
        stripeCustomerId: session.customer,
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      // Send email with license key
      await sendLicenseEmail(customerEmail, licenseKey);

      console.log('License generated and sent:', licenseKey);

    } catch (error) {
      console.error('Error processing payment:', error);
      // Still return 200 to Stripe to avoid retries
    }
  }

  res.status(200).json({ received: true });
};
