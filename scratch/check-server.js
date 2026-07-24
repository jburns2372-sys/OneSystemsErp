const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    const response = await page.goto('http://localhost:3000/projects/cmrirhhw30000ic0406v47smb/scheduling', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const url = page.url();
    const title = await page.title();
    console.log(`Success! URL: ${url}`);
    console.log(`Title: ${title}`);
    
    // Check if it's the application, login, or redirect
    if (url.includes('/login')) {
      console.log("Page displayed: login");
    } else if (url.includes('/scheduling') || url.includes('/dashboard') || url.includes('/projects')) {
      console.log("Page displayed: application or redirect");
    } else {
      console.log("Page displayed: other (" + url + ")");
    }
  } catch(e) {
    console.log(`Failure: ${e.message}`);
  }

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
