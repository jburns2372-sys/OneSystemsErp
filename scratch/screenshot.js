const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/projects/cmrirhhw30000ic0406v47smb/scheduling', { waitUntil: 'networkidle' });

  if (page.url().includes('/login')) {
    await page.fill('input[name="email"]', 'engineer@onesystemserp.com');
    await page.fill('input[name="password"]', 'Eng$V4R6#SecureGate8D!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  }

  if (!page.url().includes('/scheduling')) {
     await page.goto('http://localhost:3000/projects/cmrirhhw30000ic0406v47smb/scheduling', { waitUntil: 'networkidle' });
  }

  await page.waitForTimeout(5000); 

  await page.screenshot({ path: 'scratch/final_screenshot.png' });
  
  const btns = await page.locator('button').all();
  console.log(`Found ${btns.length} buttons.`);
  for (let i = 0; i < btns.length; i++) {
     console.log(await btns[i].textContent());
  }

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
