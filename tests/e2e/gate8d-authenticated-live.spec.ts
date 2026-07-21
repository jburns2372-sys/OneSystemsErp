import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

test.describe('Gate 8D Authenticated Live Generation', () => {
  
  test('Authenticate and Execute Live Schedule Generation', async ({ page }) => {
    test.setTimeout(120000);
    
    // Read credentials and key
    const uatEnv = dotenv.parse(fs.readFileSync('.env.uat-credentials'));
    const newPassword = uatEnv.ENGINEER_UAT_PASSWORD;
    const idempotencyKey = fs.readFileSync('artifacts/scheduling/gate8d-idempotency-key.txt', 'utf-8').trim();

    // 1. Normal Engineer Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'engineer@onesystemserp.com');
    await page.fill('input[type="password"]', newPassword);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('http://localhost:3000/');
    
    // 2. Hit the internal API using page.evaluate so cookies are included
    const body = await page.evaluate(async (key) => {
      const res = await fetch('/api/internal/reconstruction/gate8d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'GENERATE_AUTHENTICATED_SCHEDULE',
          idempotencyKey: key
        })
      });
      const data = await res.json();
      return { status: res.status, data };
    }, idempotencyKey);

    console.log('Live Run Response:', body.data);

    // It should succeed!
    expect(body.status).toBe(200);
    expect(body.data.status).toBe('SUCCESS');
    expect(body.data.scheduleId).toBeDefined();

    fs.writeFileSync('artifacts/scheduling/gate8d-live-schedule-id.txt', body.data.scheduleId);
  });
});
