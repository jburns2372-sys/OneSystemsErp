'use server';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { after } from 'next/server';
import { authDatabase } from '@/lib/auth-security/database';
import { PasswordRecoveryMailer } from '@/lib/services/PasswordRecoveryMailer';
import { validatePasswordPolicy } from '@/lib/passwordPolicy';

const GENERIC_RESPONSE = { success: true, message: 'If an eligible account exists, password-recovery instructions will be sent.' };
const INVALID_RESET = { success: false, error: 'Invalid or expired recovery request.' };
const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export async function requestPasswordReset(emailValue: string) {
  const started = Date.now();
  try {
    const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
    if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return GENERIC_RESPONSE;
    const token = crypto.randomBytes(32).toString('hex');
    const hash = digest(token);
    // Forwarded headers and user-agent strings are not rate-limit authorities.
    // The DB independently derives its atomic budget from normalized email.
    const prepared = await authDatabase.prepareRecovery(email, hash, digest('not-used-as-authority'),
      digest('not-used-as-authority'), PasswordRecoveryMailer.isConfigured());
    // Provider latency/errors never distinguish eligible accounts in the public
    // response. Next.js keeps this bounded callback alive after the response.
    after(async () => {
      if (!prepared) return;
      try {
        const delivery = await PasswordRecoveryMailer.dispatchResetLink(prepared.email, token);
        await authDatabase.recordDelivery(hash, delivery.accepted, delivery.providerId);
      } catch {
        console.error('PASSWORD_RECOVERY_DISPATCH_OPERATION_FAILED');
        try { await authDatabase.recordDelivery(hash, false, null); } catch { /* PENDING tokens cannot be redeemed. */ }
      }
    });
  } catch {
    console.error('PASSWORD_RECOVERY_REQUEST_OPERATION_FAILED');
  } finally {
    // Same minimum response time for malformed, absent, blocked and eligible
    // accounts. No recipient, token or provider payload is logged.
    const remaining = 200 - (Date.now() - started);
    if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
  }
  return GENERIC_RESPONSE;
}

export async function executePasswordReset(token: string, newPassword: string) {
  try {
    if (typeof newPassword !== 'string' || newPassword.includes('\0') || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return { success: false, error: 'Password must fit within 72 UTF-8 bytes.' };
    }
    const commonPolicy = validatePasswordPolicy(newPassword);
    if (!commonPolicy.valid) return { success: false, error: commonPolicy.error };
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return INVALID_RESET;
    const hash = digest(token);
    const eligible = await authDatabase.inspectRecovery(hash);
    if (!eligible) return INVALID_RESET;
    const accountPolicy = validatePasswordPolicy(newPassword, eligible.email);
    if (!accountPolicy.valid) return { success: false, error: accountPolicy.error };
    const newHash = await bcrypt.hash(newPassword, 12);
    // One DB transaction locks user then token, consumes once, revokes all other
    // tokens, rotates sessionVersion, clears lockout and commits its audit event.
    return await authDatabase.resetPassword(hash, newHash) === true ? { success: true } : INVALID_RESET;
  } catch {
    console.error('PASSWORD_RECOVERY_RESET_OPERATION_FAILED');
    return INVALID_RESET;
  }
}
