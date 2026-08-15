const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:5174/ktconvention/bookings', { waitUntil: 'networkidle2' });
  
  // Try to login if we are on login page
  try {
    const userInput = await page.$('input[type="text"]');
    if (userInput) {
      await page.type('input[type="text"]', 'admin');
      await page.type('input[type="password"]', 'admin'); // guess
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
  } catch(e) {}

  console.log("Logged in, attempting to click edit button");
  // wait for edit button
  await new Promise(r => setTimeout(r, 2000));
  
  // Find an edit button and click it
  // Look for a button containing the word "Edit" or pencil icon
  const buttons = await page.$$('button');
  for (let btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('Edit')) {
      await btn.click();
      console.log("Clicked Edit button");
      await new Promise(r => setTimeout(r, 2000));
      break;
    }
  }
  
  await browser.close();
})();
