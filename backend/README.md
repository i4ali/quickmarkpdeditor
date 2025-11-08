# QuickMark PDF Backend API

Backend API for license management and Stripe payment processing.

## 🏗️ Architecture

```
Frontend (Chrome Extension)
    ↓
    ↓ Purchase button clicked
    ↓
API: /api/create-checkout
    ↓
Stripe Checkout (hosted by Stripe)
    ↓
User completes payment
    ↓
Stripe Webhook → /api/webhook
    ↓
Generate license key
    ↓
Save to Supabase database
    ↓
Email license key to customer
    ↓
User enters key in extension
    ↓
API: /api/validate-license
    ↓
Premium unlocked ✨
```

## 📁 Project Structure

```
backend/
├── api/
│   ├── create-checkout.js    # Creates Stripe checkout session
│   ├── webhook.js             # Handles Stripe payment events
│   └── validate-license.js    # Validates license keys
├── utils/
│   └── database.js            # Database helpers (Supabase)
├── package.json               # Dependencies
├── vercel.json                # Vercel configuration
├── .env.example               # Environment variables template
├── supabase-schema.sql        # Database schema
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 3. Test Locally

```bash
npm run dev
```

This starts a local Vercel dev server at `http://localhost:3000`

### 4. Deploy to Vercel

```bash
npm run deploy
```

## 🔧 API Endpoints

### POST /api/create-checkout

Creates a Stripe checkout session.

**Request:**
```json
{
  "email": "user@example.com"  // Optional
}
```

**Response:**
```json
{
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST /api/webhook

Handles Stripe webhook events. Called automatically by Stripe.

**Events handled:**
- `checkout.session.completed` - Generates license key and sends email

### POST /api/validate-license

Validates a license key.

**Request:**
```json
{
  "licenseKey": "QMPDF-XXXXX-XXXXX-XXXXX"
}
```

**Response:**
```json
{
  "valid": true,
  "activatedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Environment Variables

See `.env.example` for all required variables:

- **STRIPE_SECRET_KEY** - From Stripe dashboard
- **STRIPE_PRICE_ID** - Price ID of your product
- **STRIPE_WEBHOOK_SECRET** - From Stripe webhook settings
- **SUPABASE_URL** - From Supabase project settings
- **SUPABASE_SERVICE_KEY** - From Supabase API settings
- **EMAIL_USER** - Gmail address
- **EMAIL_PASSWORD** - Gmail app password
- **SUCCESS_URL** - Where to redirect after successful payment
- **CANCEL_URL** - Where to redirect if payment is cancelled

## 📊 Database Schema

The `licenses` table stores all license keys:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| license_key | VARCHAR(50) | License key (unique) |
| email | VARCHAR(255) | Customer email |
| stripe_session_id | VARCHAR(255) | Stripe session ID |
| stripe_customer_id | VARCHAR(255) | Stripe customer ID |
| status | VARCHAR(20) | 'active' or 'revoked' |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

## 🧪 Testing

### Test Stripe Integration

Use Stripe test cards:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

### Test API Endpoints

```bash
# Create checkout
curl -X POST http://localhost:3000/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Validate license
curl -X POST http://localhost:3000/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"QMPDF-XXXXX-XXXXX-XXXXX"}'
```

### Test Webhook Locally

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhook
stripe trigger checkout.session.completed
```

## 📝 License Key Format

Format: `QMPDF-XXXXX-XXXXX-XXXXX`

- Prefix: `QMPDF-`
- 3 segments of 5 alphanumeric characters
- Total length: 23 characters

Example: `QMPDF-AB123-CD456-EF789`

## 🚨 Error Handling

All endpoints return proper HTTP status codes:

- **200**: Success
- **400**: Bad request (invalid input)
- **404**: Not found (license key doesn't exist)
- **405**: Method not allowed
- **500**: Server error

## 🔒 Security

- License keys validated server-side
- Webhook signatures verified
- CORS enabled for extension origin
- Sensitive data in environment variables
- Database access via service key only

## 📈 Monitoring

### Vercel Logs

```bash
vercel logs
```

Or view in dashboard: https://vercel.com/dashboard

### Stripe Events

View all events in Stripe dashboard:
https://dashboard.stripe.com/events

### Database Queries

View in Supabase dashboard:
https://supabase.com/dashboard

## 🛠️ Development

### Run Locally

```bash
npm run dev
```

### Format Code

```bash
npm install -D prettier
npx prettier --write .
```

### Deploy

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📞 Troubleshooting

### Webhook not receiving events

1. Check webhook URL in Stripe dashboard
2. Verify webhook secret in environment variables
3. Check Vercel function logs
4. Ensure endpoint is deployed

### Database connection fails

1. Verify Supabase URL and service key
2. Check if IP is allowed in Supabase settings
3. Test connection with Supabase client directly

### Emails not sending

1. Verify Gmail app password (not regular password)
2. Check if 2FA is enabled on Gmail account
3. View Vercel function logs for errors
4. Test with a simple nodemailer script

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Supabase Documentation](https://supabase.com/docs)
- [Nodemailer Documentation](https://nodemailer.com/)

---

Built with ❤️ for QuickMark PDF
