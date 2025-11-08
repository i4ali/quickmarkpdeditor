# Stripe Payment Integration for QuickMark PDF

## 🎯 Architecture Overview

```
User clicks "Purchase $3.99"
    ↓
Extension redirects to Stripe Checkout
    ↓
User pays via Stripe
    ↓
Stripe webhook notifies your backend
    ↓
Backend generates license key
    ↓
Backend emails license key to user
    ↓
User enters key in extension
    ↓
Extension validates key via API
    ↓
Premium unlocked!
```

---

## 📋 Prerequisites

- Stripe account (you already have this ✅)
- Domain for hosting backend (or use Vercel/Netlify free tier)
- Database for storing license keys (Firebase, Supabase, or PostgreSQL)

---

## 🚀 Quick Setup Steps

### Step 1: Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** and **Secret key**
3. Note: Use test keys for development

### Step 2: Create Stripe Product

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Name: "QuickMark PDF Premium - Lifetime License"
4. Price: $3.99 USD (one-time payment)
5. Copy the **Price ID** (starts with `price_...`)

### Step 3: Deploy Backend

I'll create two options for you:

**Option A: Vercel (Recommended - Free tier, easy setup)**
**Option B: Node.js/Express server**

---

## 💻 Backend Code

I'll create the backend API files for you now.

### Tech Stack:
- Vercel Serverless Functions
- Stripe SDK
- Simple license key generation
- Database: Supabase (free tier) or Firebase

---

## 📝 What I'll Create:

1. `api/create-checkout.js` - Creates Stripe checkout session
2. `api/webhook.js` - Handles Stripe webhooks
3. `api/validate-license.js` - Validates license keys
4. `api/config.js` - Configuration
5. `backend/database.js` - Database helper
6. `vercel.json` - Vercel deployment config
7. `.env.example` - Environment variables template

Let me create these files now...
