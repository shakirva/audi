import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });
  page.on('pageerror', error => console.log('UNCAUGHT PAGE ERROR:', error.message));
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log('Nav Err:', e.message));
  await browser.close();
})();
