# QuickMark PDF - Simplified Backend (No Database!)

## 🎯 What's Different?

This is a **simpler alternative** to the full backend that doesn't require a database.

**Instead of:** Database → Store license keys → Query to validate
**We use:** JWT tokens → Sign with secret → Verify signature

---

## ✅ Pros

- ✨ **No database setup** - Skip Supabase entirely
- ⚡ **Faster** - No database queries
- 💰 **$0 cost** - Only Stripe fees (2.9% + 30¢)
- 🚀 **Easier deployment** - Fewer moving parts
- 🔐 **Still secure** - JWT signatures can't be forged

---

## ❌ Cons

- Can't revoke licenses after issuing
- Can't track who's using what
- Can't see analytics (who purchased when)
- License keys can be shared (but this is true either way for $3.99)

---

## 🏗️ How It Works

```
1. User purchases → Stripe Checkout
2. Stripe webhook → Your backend
3. Generate JWT token as license key:
   {
     email: "user@example.com",
     product: "quickmark_pdf_premium",
     purchaseDate: "2024-01-01",
     signature: "cryptographic_signature"
   }
4. Email JWT to user
5. User enters JWT in extension
6. Extension sends to /api/validate-license
7. Backend verifies JWT signature
8. If valid → premium unlocked!
```

**No database queries, just cryptography!**

---

## 📦 What's Included

```
backend-simple/
├── api/
│   ├── create-checkout.js  # Creates Stripe checkout
│   ├── webhook.js          # Generates JWT license keys
│   └── validate-license.js # Verifies JWT signatures
├── package.json
├── vercel.json
└── .env.example
```

---

## 🚀 Setup (5 Minutes)

### 1. Install Dependencies

```bash
cd backend-simple
npm install
```

### 2. Configure Environment

Create `.env`:

```bash
# Stripe (from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT Secret (generate a random string)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# URLs
SUCCESS_URL=https://yourdomain.com/success
CANCEL_URL=https://yourdomain.com/cancel
```

### 3. Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel

# Add environment variables in Vercel dashboard
# Then deploy to production
vercel --prod
```

### 4. Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-backend.vercel.app/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy signing secret → add to Vercel env vars
5. Redeploy: `vercel --prod`

Done! ✅

---

## 🧪 Testing

### Test Checkout

```bash
curl -X POST https://your-backend.vercel.app/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test License Validation

After a test purchase, you'll receive a JWT token via email. Test it:

```bash
curl -X POST https://your-backend.vercel.app/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

---

## 🔐 Security

- JWT tokens signed with secret key
- Can't be forged without the secret
- Secret key only stored on Vercel (server-side)
- Extension can't generate fake licenses

---

## 💡 Should You Use This?

**Use simplified version if:**
- You want simplest possible setup
- You don't need to revoke licenses
- You don't need usage analytics
- Your product is <$10 (piracy is acceptable)

**Use full database version if:**
- You want to revoke licenses
- You want usage analytics
- You need audit trail of purchases
- You might offer refunds

**For a $3.99 lifetime product → Simplified is perfect!**

---

## 📊 Cost Comparison

### Simplified (No Database):
- **Monthly**: $0
- **Per sale**: Stripe fee only (~$0.42)
- **Your profit**: ~$3.57 per sale

### Full Version (With Database):
- **Monthly**: $0 (Supabase free tier)
- **Per sale**: Stripe fee only (~$0.42)
- **Your profit**: ~$3.57 per sale

**Same cost, but simplified is easier!**

---

## 🔄 Migration

If you start with simplified and later want database:
1. Keep existing JWT licenses valid
2. New purchases → save to database
3. Validation checks both JWT and database

---

## 🆘 Troubleshooting

### "Invalid signature" error
- Check JWT_SECRET matches between webhook and validation
- Ensure you're using the exact token from email

### Email not sending
- Verify Gmail app password (not regular password)
- Check EMAIL_USER and EMAIL_PASSWORD in env vars

### Webhook not firing
- Check webhook URL in Stripe dashboard
- Verify STRIPE_WEBHOOK_SECRET is set correctly

---

**This is the recommended approach for QuickMark PDF!**

Simple, secure, and costs $0/month. 🎉
