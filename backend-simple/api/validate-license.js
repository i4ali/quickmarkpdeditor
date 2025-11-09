// Validates JWT license keys (no database needed!)
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { licenseKey } = req.body;

    if (!licenseKey) {
      return res.status(400).json({
        valid: false,
        error: 'License key required'
      });
    }

    // Verify JWT signature (no database lookup needed!)
    const decoded = jwt.verify(licenseKey, process.env.JWT_SECRET);

    // Check if it's for the right product
    if (decoded.product !== 'quickmark_pdf_premium') {
      return res.status(400).json({
        valid: false,
        error: 'Invalid product'
      });
    }

    // Valid license!
    res.status(200).json({
      valid: true,
      email: decoded.email,
      purchaseDate: decoded.purchaseDate
    });

  } catch (error) {
    // JWT verification failed
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        valid: false,
        error: 'Invalid license key'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        valid: false,
        error: 'License key expired'
      });
    }

    console.error('License validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Server error'
    });
  }
};
