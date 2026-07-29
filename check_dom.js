import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  await page.goto('http://localhost:5173/reports', { waitUntil: 'networkidle0', timeout: 10000 });
  const html = await page.evaluate(() => document.querySelector('#root').innerHTML);
  console.log('HTML:', html.substring(0, 500));
  await browser.close();
})();
