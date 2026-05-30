const fs = require('fs');
const path = require('path');

const assets = path.join(__dirname, 'assets');
const wechat = fs.readFileSync(path.join(assets, 'wechat-pay.png')).toString('base64');
const alipay = fs.readFileSync(path.join(assets, 'alipay.png')).toString('base64');

const out = `/** Embedded QR codes — bundled with site so Vercel always serves them */
const PAYMENT_QR = {
  WECHAT: "data:image/png;base64,${wechat}",
  ALIPAY: "data:image/png;base64,${alipay}"
};
`;

fs.writeFileSync(path.join(__dirname, 'payment-qr.js'), out);
console.log('payment-qr.js written', { wechat: wechat.length, alipay: alipay.length });
