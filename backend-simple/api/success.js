const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html');

  // Get session_id from query params
  const sessionId = req.query.session_id;
  let licenseKey = '';
  let email = '';
  let error = false;

  if (sessionId) {
    try {
      // Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      email = session.customer_email || session.customer_details?.email;

      if (email) {
        // Generate the same license key that webhook would generate
        licenseKey = jwt.sign(
          {
            email: email,
            product: 'quickmark_pdf_premium',
            purchaseDate: new Date().toISOString(),
            stripeSessionId: session.id
          },
          process.env.JWT_SECRET,
          { expiresIn: '100y' }
        );
      }
    } catch (err) {
      console.error('Error retrieving session:', err);
      error = true;
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Purchase Successful - QuickMark PDF</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 50px;
            max-width: 600px;
            width: 100%;
            text-align: center;
        }
        .success-icon {
            font-size: 80px;
            margin-bottom: 20px;
        }
        h1 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 32px;
        }
        p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
            font-size: 16px;
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 30px 0;
            text-align: left;
            border-radius: 5px;
        }
        .info-box h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .info-box ol {
            margin-left: 20px;
            color: #555;
        }
        .info-box li {
            margin: 10px 0;
        }
        .email-notice {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .email-notice strong {
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Purchase Successful!</h1>
        <p>Thank you for upgrading to QuickMark PDF Premium!</p>

        ${licenseKey ? `
        <div class="email-notice" style="background: #d4edda; border: 1px solid #28a745;">
            <strong style="color: #155724;">✅ Your License Key</strong>
            <p style="margin-top: 10px; margin-bottom: 10px; color: #155724;">Copy this key now! It has also been sent to ${email}</p>
            <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
                <code style="font-size: 12px; word-break: break-all; color: #333; display: block;">${licenseKey}</code>
            </div>
            <button id="copyBtn" onclick="copyLicense(this)" style="margin-top: 10px; padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                📋 Copy License Key
            </button>
        </div>
        ` : `
        <div class="email-notice">
            <strong>📧 Check Your Email</strong>
            <p style="margin-top: 10px; margin-bottom: 0;">Your license key has been sent to your email address. Please check your inbox (and spam folder).</p>
        </div>
        `}

        <div class="info-box">
            <h3>How to Activate Your License:</h3>
            <ol>
                <li>Open the QuickMark PDF extension</li>
                <li>Click the "⭐ Upgrade to Pro" button</li>
                <li>Click "Activate with license key"</li>
                <li>Paste your license key from the email</li>
                <li>Enjoy all premium features! 🎉</li>
            </ol>
        </div>

        <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Need help? Contact us at ali.muhammadimran@gmail.com
        </p>
    </div>

    <script>
        function copyLicense(btn) {
            const licenseText = \`${licenseKey}\`;
            navigator.clipboard.writeText(licenseText).then(() => {
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ Copied!';
                btn.style.background = '#218838';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '#28a745';
                }, 2000);
            }).catch(err => {
                console.error('Copy failed:', err);
                alert('Failed to copy. Please select and copy the license key manually.');
            });
        }
    </script>
</body>
</html>`;

  res.status(200).send(html);
};
