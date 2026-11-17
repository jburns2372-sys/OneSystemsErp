import { authDatabase } from './database';

// The dedicated PostgreSQL SECURITY DEFINER operation verifies the password
// under a row lock, updates the failure count and commits the final actor.
// It does not trust any application-supplied password-validity boolean.
export async function authenticateCredentials(emailValue: unknown, passwordValue: unknown) {
  if (typeof emailValue !== 'string' || typeof passwordValue !== 'string'
    || emailValue.length > 254 || passwordValue.length > 1024 || !passwordValue
    || passwordValue.includes('\0')) return null;
  const email = emailValue.trim().toLowerCase();
  const started = Date.now();
  try {
    return await authDatabase.verifyLogin(email, passwordValue);
  } catch {
    console.error('AUTHENTICATION_OPERATION_FAILED');
    return null;
  } finally {
    const remaining = 600 - (Date.now() - started);
    if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
  }
}
