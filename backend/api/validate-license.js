// Vercel Serverless Function
// Validates license keys for QuickMark PDF Premium

const { getLicense } = require('../utils/database');

module.exports = async (req, res) => {
  // Enable CORS
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

    // Validate format
    const pattern = /^QMPDF-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    if (!pattern.test(licenseKey)) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid license key format'
      });
    }

    // Check database
    const license = await getLicense(licenseKey);

    if (!license) {
      return res.status(404).json({
        valid: false,
        error: 'License key not found'
      });
    }

    if (license.status !== 'active') {
      return res.status(403).json({
        valid: false,
        error: 'License key is not active'
      });
    }

    // Valid license
    res.status(200).json({
      valid: true,
      activatedAt: license.createdAt
    });

  } catch (error) {
    console.error('License validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Server error'
    });
  }
};
