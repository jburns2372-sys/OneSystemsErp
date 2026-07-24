import { chromium } from 'playwright';

async function run() {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('http://localhost:3000/login');
  await p.fill('input[type="email"]', 'J.BURNS2372@GMAIL.COM');
  await p.fill('input[type="password"]', 'Junixsys_001');
  await p.click('button[type="submit"]');
  await p.waitForTimeout(3000);
  
  await p.goto('http://localhost:3000/users');
  await p.waitForTimeout(3000);
  
  await p.screenshot({ path: 'users-page.png' });
  await b.close();
}
run();
