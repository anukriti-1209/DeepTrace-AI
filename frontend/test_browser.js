const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message, error.stack));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await browser.close();
  process.exit(0);
})();
