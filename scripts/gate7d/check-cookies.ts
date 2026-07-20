import { chromium } from 'playwright';

async function run() {
  const b = await chromium.launch({ headless: true });
  const context = await b.newContext();
  const p = await context.newPage();
  
  await p.goto('http://localhost:3000/login');
  await p.fill('input[type="email"]', 'J.BURNS2372@GMAIL.COM');
  await p.fill('input[type="password"]', 'Junixsys_001');
  await p.click('button[type="submit"]');
  await p.waitForTimeout(3000);
  
  const cookies = await context.cookies();
  console.log('Cookies after login:', cookies);
  
  await b.close();
}
run();
