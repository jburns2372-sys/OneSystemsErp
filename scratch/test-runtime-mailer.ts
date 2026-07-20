import { PasswordRecoveryMailer } from '../src/lib/services/PasswordRecoveryMailer';

async function test() {
  const result = await PasswordRecoveryMailer.sendTestEmail(
    'j.burns2372@gmail.com',
    'OneSystemsERP Recovery Runtime Key Verification',
    'The password-recovery runtime is using the verified V4-R7 UAT Resend configuration. This message contains no recovery token or sensitive data.'
  );
  console.log(JSON.stringify(result, null, 2));
}

test();
