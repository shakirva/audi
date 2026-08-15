import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('CRASH ERROR:', err.toString()));
  
  await page.goto('http://localhost:5174/test.html');
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Clicking Open Modal button...");
  await page.click('#open-btn');
  
  await new Promise(r => setTimeout(r, 2000));
  console.log("Finished test check.");
  await browser.close();
})();
