# Test License Keys for QuickMark PDF Premium

These are valid JWT-based license keys that can be used for testing the premium features.

## Test License Key 1
**Email:** test1@example.com

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QxQGV4YW1wbGUuY29tIiwicHJvZHVjdCI6InF1aWNrbWFya19wZGZfcHJlbWl1bSIsInB1cmNoYXNlRGF0ZSI6IjIwMjUtMTEtMDlUMTY6NTE6MzcuNzA5WiIsImlhdCI6MTc2MjcwNzA5NywiZXhwIjo0OTE4NDY3MDk3fQ.NhTA2R5Gd2OVUDYQNTXyqFz9TscTxd3RoQktjAVocs4
```

## Test License Key 2
**Email:** test2@example.com

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QyQGV4YW1wbGUuY29tIiwicHJvZHVjdCI6InF1aWNrbWFya19wZGZfcHJlbWl1bSIsInB1cmNoYXNlRGF0ZSI6IjIwMjUtMTEtMDlUMTY6NTE6MzcuNzEwWiIsImlhdCI6MTc2MjcwNzA5NywiZXhwIjo0OTE4NDY3MDk3fQ.DI5QEYM9MLoazJfvVLIQOZfOFoR_pNCzkSF9rld85Wc
```

## Test License Key 3
**Email:** test3@example.com

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QzQGV4YW1wbGUuY29tIiwicHJvZHVjdCI6InF1aWNrbWFya19wZGZfcHJlbWl1bSIsInB1cmNoYXNlRGF0ZSI6IjIwMjUtMTEtMDlUMTY6NTE6MzcuNzEwWiIsImlhdCI6MTc2MjcwNzA5NywiZXhwIjo0OTE4NDY3MDk3fQ.n24OngxQuJXfYvS2tCrd_WNpRoSPATaZvBQ3_krpnNw
```

## How to Use

1. Open the QuickMark PDF extension
2. Click "⭐ Upgrade to Pro"
3. Scroll down to "Activate with license key"
4. Paste any of the keys above
5. Click "Activate License"
6. Premium features will be unlocked! ✅

## Notes

- These keys are signed with the JWT_SECRET from your backend
- They expire in 100 years (valid until 2125)
- They are for testing purposes only
- Real customers will receive keys via email after purchase through Stripe

## Generate More Test Keys

To generate additional test keys, run:

```bash
cd backend-simple
node generate-test-keys.js
```

This will create new JWT tokens signed with your current JWT_SECRET.
