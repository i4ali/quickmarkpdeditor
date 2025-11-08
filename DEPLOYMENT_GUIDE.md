# QuickMark PDF - Complete Deployment Guide

## 🎯 Complete Setup in 7 Steps

This guide will walk you through deploying your backend and submitting to Chrome Web Store.

---

## Step 1: Set Up Supabase (Free Database)

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Sign in
3. Click "New Project"
4. Fill in:
   - **Name**: quickmark-pdf
   - **Database Password**: [create a strong password]
   - **Region**: Choose closest to you
5. Wait for project to provision (~2 minutes)

### 1.2 Create Database Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste from `backend/supabase-schema.sql`
4. Click "Run"
5. Verify table created: Go to **Table Editor** → should see "licenses" table

### 1.3 Get API Keys

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - `Project URL` → This is your SUPABASE_URL
   - `service_role` key → This is your SUPABASE_SERVICE_KEY

---

## Step 2: Configure Stripe

### 2.1 Get Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)

### 2.2 Create Product

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Fill in:
   - **Name**: QuickMark PDF Premium - Lifetime License
   - **Description**: Lifetime access to all premium PDF annotation features
   - **Pricing**: One-time payment
   - **Price**: $3.99 USD
4. Click "Save product"
5. **Copy the Price ID** (starts with `price_...`) - you'll need this!

---

## Step 3: Set Up Email (Gmail)

### 3.1 Enable 2-Factor Authentication

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification if not already enabled

### 3.2 Generate App Password

1. Go to https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other" → enter "QuickMark PDF"
4. Click "Generate"
5. **Copy the 16-character password** - you'll need this!

---

## Step 4: Deploy Backend to Vercel

### 4.1 Install Vercel CLI

```bash
cd backend
npm install
npm install -g vercel
```

### 4.2 Create .env File

Create `backend/.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_PRICE_ID=price_YOUR_PRICE_ID_HERE
STRIPE_WEBHOOK_SECRET=whsec_...  # We'll get this in next step

# URLs (update after deploying)
SUCCESS_URL=https://yourdomain.com/success
CANCEL_URL=https://yourdomain.com/cancel

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
SUPPORT_EMAIL=support@yourdomain.com
```

### 4.3 Deploy to Vercel

```bash
cd backend
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **quickmark-pdf-backend**
- Directory? **./backend** (or just press Enter)
- Override settings? **N**

Vercel will deploy and give you a URL like:
`https://quickmark-pdf-backend.vercel.app`

### 4.4 Configure Environment Variables in Vercel

```bash
# Set each environment variable
vercel env add STRIPE_SECRET_KEY
vercel env add STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_PRICE_ID
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add EMAIL_USER
vercel env add EMAIL_PASSWORD
vercel env add SUPPORT_EMAIL
vercel env add SUCCESS_URL
vercel env add CANCEL_URL
```

Or use the Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all variables

### 4.5 Re-deploy with Environment Variables

```bash
vercel --prod
```

Your backend is now live at: `https://quickmark-pdf-backend.vercel.app`

---

## Step 5: Configure Stripe Webhook

### 5.1 Create Webhook in Stripe

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `https://your-backend.vercel.app/api/webhook`
4. Select events:
   - `checkout.session.completed`
5. Click "Add endpoint"
6. **Copy the Signing Secret** (starts with `whsec_...`)

### 5.2 Add Webhook Secret to Vercel

```bash
vercel env add STRIPE_WEBHOOK_SECRET
# Paste the signing secret when prompted
vercel --prod
```

---

## Step 6: Update Extension Code

### 6.1 Update Backend URL in Extension

Replace `https://your-backend.vercel.app` with your actual Vercel URL in:

**license.js** (line 32):
```javascript
const response = await fetch('https://quickmark-pdf-backend.vercel.app/api/validate-license', {
```

**editor.js** (line 770):
```javascript
const response = await fetch('https://quickmark-pdf-backend.vercel.app/api/create-checkout', {
```

### 6.2 Rebuild Extension

```bash
./build-extension.sh
```

---

## Step 7: Submit to Chrome Web Store

### 7.1 Create Developer Account

1. Go to https://chrome.google.com/webstore/devconsole
2. Pay $5 one-time fee
3. Complete developer profile

### 7.2 Prepare Store Assets

You need to create:

**Screenshots** (take screenshots of your extension):
- 1280x800px or 640x400px
- Show: PDF editing, annotations, highlighting, shapes
- Save 3-5 screenshots

**Promotional Images** (use Canva or Photoshop):
- Small tile: 440x280px
- Large tile: 920x680px
- Optional marquee: 1400x560px

### 7.3 Create Privacy Policy

Host this somewhere (GitHub Pages, Vercel, etc.):

See example in `CHROME_STORE_GUIDE.md` → Privacy Policy section

Get the URL (e.g., `https://yourdomain.com/privacy`)

### 7.4 Upload Extension

1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload `quickmark-pdf-v2.0.zip`
4. Fill in store listing:

**Product Details:**
- Product name: `QuickMark PDF - Edit, Sign & Annotate`
- Summary: `Fast PDF editor: add text, signatures, highlights, shapes & notes. Edit PDFs privately in your browser - no uploads needed!`
- Description: See `CHROME_STORE_GUIDE.md` for full description
- Category: Productivity
- Language: English

**Graphics:**
- Upload icon (already in ZIP)
- Upload screenshots
- Upload promotional images

**Privacy:**
- Privacy policy URL: Your hosted privacy policy
- Single purpose: PDF editing and annotation
- Permissions justification: Storage permission for saving signatures and license keys

**Pricing & Distribution:**
- Pricing: **Free** (monetization is external via Stripe)
- Distribution: All countries
- Mature content: No

5. Click "Submit for Review"

### 7.5 Review Process

- Takes 1-3 business days
- Google will email you with status
- Common issues:
  - Privacy policy not accessible
  - Screenshots don't show actual functionality
  - Description doesn't match functionality

---

## Step 8: Test Everything

### 8.1 Test Purchase Flow

1. Install extension from Chrome Web Store (after approval)
2. Click a premium feature
3. Click "Purchase $3.99"
4. Should redirect to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
6. Complete checkout
7. Check email for license key
8. Enter license key in extension
9. Premium features should unlock

### 8.2 Verify Backend

Test each endpoint:

```bash
# Test create-checkout
curl -X POST https://your-backend.vercel.app/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test validate-license (use a real key from Supabase)
curl -X POST https://your-backend.vercel.app/api/validate-license \
  -H "Content-Type: application/json" \
  -d '{"licenseKey":"QMPDF-XXXXX-XXXXX-XXXXX"}'
```

---

## 📊 Monitoring & Analytics

### Vercel Analytics

1. Go to Vercel dashboard → your project
2. View function logs, errors, performance

### Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Monitor payments, customers, failed payments

### Supabase Analytics

1. Go to Supabase dashboard
2. View database queries, storage

### Chrome Web Store Analytics

1. Go to https://chrome.google.com/webstore/devconsole
2. View installs, uninstalls, ratings, reviews

---

## 🚨 Important Notes

### Testing vs Production

- **Test Mode**: Use Stripe test keys (`sk_test_...`, `pk_test_...`)
- **Production**: Switch to live keys after testing (`sk_live_...`, `pk_live_...`)

### Costs

- **Supabase**: Free tier (500MB database, 2GB bandwidth)
- **Vercel**: Free tier (100GB bandwidth, serverless functions)
- **Stripe**: 2.9% + 30¢ per transaction
- **Gmail**: Free

### Security

- Never commit `.env` file to git
- Keep Stripe secret keys secure
- Use HTTPS only
- Validate license keys server-side

---

## 🎉 Launch Checklist

Before going live:

- [ ] Supabase database created and schema applied
- [ ] Stripe product created ($3.99)
- [ ] Backend deployed to Vercel
- [ ] All environment variables set
- [ ] Stripe webhook configured
- [ ] Email sending tested
- [ ] Extension code updated with backend URL
- [ ] Extension tested end-to-end
- [ ] Privacy policy hosted
- [ ] Store assets created (screenshots, images)
- [ ] Chrome Web Store listing completed
- [ ] Extension submitted for review
- [ ] Test purchase flow works
- [ ] License validation works

---

## 🆘 Troubleshooting

### License validation fails

- Check backend URL in `license.js`
- Verify environment variables in Vercel
- Check Supabase connection
- Test API endpoint directly

### Stripe webhook not firing

- Verify webhook URL in Stripe dashboard
- Check webhook secret in Vercel env vars
- View logs in Vercel dashboard
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`

### Email not sending

- Verify Gmail app password
- Check email credentials in Vercel
- View Vercel function logs for errors
- Test with a simple nodemailer script

### Extension rejected

- Read rejection reason carefully
- Common issues: privacy policy, permissions, description
- Fix and resubmit

---

## 📞 Support

If you get stuck:

1. Check Vercel logs
2. Check Stripe dashboard → Logs
3. Check browser console for errors
4. Verify all environment variables
5. Test each component separately

---

Good luck with your launch! 🚀
