import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.uat-v4-r7.credentials.local' });
dotenv.config();

import { Resend } from 'resend';

async function trace() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.PASSWORD_RECOVERY_EMAIL_FROM || 'security@mail.onesystemserp.com';
  console.log(`Using API KEY: ${apiKey ? 'Found' : 'Missing'}`);
  console.log(`Using FROM: ${fromAddress}`);

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: fromAddress,
    to: 'j.burns2372@gmail.com',
    subject: 'Password Recovery Instructions',
    text: 'test'
  });

  console.log(JSON.stringify(result, null, 2));
}

trace();
