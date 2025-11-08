// Database utilities for license management
// Using Supabase (you can also use Firebase, PostgreSQL, etc.)

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Initialize email transporter (using Gmail as example)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Use App Password, not regular password
  }
});

/**
 * Save license to database
 */
async function saveLicense(licenseData) {
  const { data, error } = await supabase
    .from('licenses')
    .insert([licenseData]);

  if (error) {
    console.error('Database error:', error);
    throw new Error('Failed to save license');
  }

  return data;
}

/**
 * Get license by key
 */
async function getLicense(licenseKey) {
  const { data, error } = await supabase
    .from('licenses')
    .select('*')
    .eq('licenseKey', licenseKey)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    console.error('Database error:', error);
    throw new Error('Failed to retrieve license');
  }

  return data;
}

/**
 * Send license key via email
 */
async function sendLicenseEmail(email, licenseKey) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🎉 Your QuickMark PDF Premium License Key',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4CAF50;">Welcome to QuickMark PDF Premium!</h1>

        <p>Thank you for your purchase! Your lifetime premium license is ready.</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Your License Key:</h2>
          <p style="font-size: 24px; font-weight: bold; color: #333; letter-spacing: 2px; font-family: monospace;">
            ${licenseKey}
          </p>
        </div>

        <h3>How to activate:</h3>
        <ol>
          <li>Open the QuickMark PDF extension</li>
          <li>Click on any premium feature (Highlight, Draw, Shapes, etc.)</li>
          <li>In the upgrade modal, click "Activate License Key"</li>
          <li>Enter your license key above</li>
          <li>Enjoy all premium features forever!</li>
        </ol>

        <h3>What's included:</h3>
        <ul>
          <li>✨ Text highlighting with multiple colors</li>
          <li>✏️ Freehand drawing tool</li>
          <li>📐 Shapes (rectangles, circles, arrows, lines)</li>
          <li>📝 Sticky notes</li>
          <li>➖ Text decorations (underline, strikethrough)</li>
        </ul>

        <p style="margin-top: 30px; color: #666;">
          Need help? Reply to this email or contact: ${process.env.SUPPORT_EMAIL}
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 40px;">
          This is a one-time purchase. No subscriptions, no recurring fees.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('License email sent to:', email);
  } catch (error) {
    console.error('Email error:', error);
    // Don't throw - we've already saved the license
  }
}

module.exports = {
  saveLicense,
  getLicense,
  sendLicenseEmail
};
