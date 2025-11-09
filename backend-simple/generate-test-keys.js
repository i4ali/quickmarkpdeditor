// Generate test license keys for development
const jwt = require('jsonwebtoken');

const JWT_SECRET = '57c90ebd520d77df3c9bc6d9c595b6749005f146d82327ea04542b16c7ac90ea';

// Generate 3 test license keys
const testKeys = [
  {
    email: 'test1@example.com',
    product: 'quickmark_pdf_premium',
    purchaseDate: new Date().toISOString()
  },
  {
    email: 'test2@example.com',
    product: 'quickmark_pdf_premium',
    purchaseDate: new Date().toISOString()
  },
  {
    email: 'test3@example.com',
    product: 'quickmark_pdf_premium',
    purchaseDate: new Date().toISOString()
  }
];

console.log('Test License Keys:\n');
testKeys.forEach((data, index) => {
  const token = jwt.sign(data, JWT_SECRET, { expiresIn: '100y' });
  console.log(`Test Key ${index + 1} (${data.email}):`);
  console.log(token);
  console.log('');
});
