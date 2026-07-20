import dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7.credentials.local' });
dotenv.config();

import { Resend } from 'resend';

async function checkResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('No RESEND_API_KEY found');
    return;
  }

  // The Resend SDK doesn't always have a straightforward `emails.list()` in older versions,
  // but let's try calling it or use fetch directly.
  try {
    const response = await fetch('https://api.resend.com/emails', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch from Resend API:', response.status, await response.text());
      return;
    }

    const data = await response.json();
    console.log(`Retrieved ${data.data?.length || 0} emails from Resend API.`);
    
    // Sort by created_at descending just in case
    const emails = data.data || [];
    emails.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // We only want the most recent recovery request for j.burns2372@gmail.com
    const targetEmail = emails.find((e: any) => e.to.includes('j.burns2372@gmail.com'));
    
    if (targetEmail) {
      console.log('--- FOUND EMAIL ---');
      console.log(`To: ${targetEmail.to.map((t: string) => t.replace(/^(.{2}).+@/, '$1***@')).join(', ')}`);
      console.log(`Subject: ${targetEmail.subject}`);
      console.log(`ID: ${targetEmail.id}`);
      console.log(`Status: ${targetEmail.status}`);
      console.log(`Created At: ${targetEmail.created_at}`);
    } else {
      console.log('No email found to j.burns2372@gmail.com in recent Resend logs.');
      // Let's print the latest email anyway just to see what happened
      if (emails.length > 0) {
        const latest = emails[0];
        console.log('Latest email was to:', latest.to, 'Subject:', latest.subject);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkResend();
