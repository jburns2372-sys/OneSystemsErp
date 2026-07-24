import dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7.credentials.local' });
dotenv.config();

import { Resend } from 'resend';

async function verifyResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('No RESEND_API_KEY found');
    return;
  }

  const resend = new Resend(apiKey);
  
  const fromAddress = process.env.PASSWORD_RECOVERY_EMAIL_FROM || 'onboarding@resend.dev'; // fallback if needed

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: 'j.burns2372@gmail.com',
      subject: 'OneSystemsERP Resend Key Verification',
      text: 'The replacement Resend API key was accepted for V4-R7 UAT email delivery.\nThis message contains no password-reset token or sensitive information.',
      html: '<p>The replacement Resend API key was accepted for V4-R7 UAT email delivery.</p><p>This message contains no password-reset token or sensitive information.</p>'
    });

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Exception during Resend API call:', error);
  }
}

verifyResend();
