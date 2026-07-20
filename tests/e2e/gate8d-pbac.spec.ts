import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

test.describe('Gate 8D PBAC and Separation of Duty', () => {
  
  test('Site Engineer is denied schedule approval and baseline activation', async ({ page }) => {
    test.setTimeout(120000);
    
    const uatEnv = dotenv.parse(fs.readFileSync('.env.uat-credentials'));
    const newPassword = uatEnv.ENGINEER_UAT_PASSWORD;
    const scheduleId = fs.readFileSync('artifacts/scheduling/gate8d-live-schedule-id.txt', 'utf-8').trim();
    const projectId = process.env.GATE8D_TARGET_PROJECT_ID || 'cmrirhhw30000ic0406v47smb';

    // 1. Normal Engineer Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'engineer@onesystemserp.com');
    await page.fill('input[type="password"]', newPassword);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('http://localhost:3000/');
    
    // 2. Try to approve schedule
    const approveResult = await page.evaluate(async ({ pid, sid }) => {
      const res = await fetch(`/api/projects/${pid}/scheduling/${sid}/review/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRowVersion: 1 })
      });
      return res.status;
    }, { pid: projectId, sid: scheduleId });

    // Expect 403 Forbidden
    expect(approveResult).toBe(403);

    // 3. Try to activate baseline
    const activateResult = await page.evaluate(async ({ pid, sid }) => {
      const res = await fetch(`/api/projects/${pid}/scheduling/${sid}/baseline/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRowVersion: 1, idempotencyKey: 'test-key-123' })
      });
      return res.status;
    }, { pid: projectId, sid: scheduleId });

    // Expect 403 Forbidden
    expect(activateResult).toBe(403);
  });
});
