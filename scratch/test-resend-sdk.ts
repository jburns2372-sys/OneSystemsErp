import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Resend } from 'resend';

async function run() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: 'test@example.com',
    to: 'j.burns2372@gmail.com',
    subject: 'Test',
    text: 'test'
  });
  console.log(JSON.stringify(result, null, 2));
}

run();
