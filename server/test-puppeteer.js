const puppeteer = require('puppeteer');
const jwt = require('jsonwebtoken');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  const token = jwt.sign({ id: 1, email: 'owner@venueza.com', role: 'Owner' }, 'hallmaster_jwt_secret_key_2026_secure');
  
  await page.goto('http://localhost:5175');
  await page.evaluate((token) => {
    localStorage.setItem('hm_token', token);
  }, token);
  
  await page.goto('http://localhost:5175/expenses');
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
