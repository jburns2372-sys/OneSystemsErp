export function validatePasswordPolicy(password: string, emailOrUsername?: string): { valid: boolean; error?: string } {
  if (!password || password.trim().length === 0) {
    return { valid: false, error: 'Password cannot be empty.' };
  }
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters long.' };
  }
  
  const lowerPass = password.toLowerCase();
  if (['password123', 'admin123', 'jejors2026', 'onesystemserp'].includes(lowerPass)) {
    return { valid: false, error: 'Password cannot be a known default, placeholder, or bypass value.' };
  }

  if (emailOrUsername && lowerPass === emailOrUsername.toLowerCase()) {
    return { valid: false, error: 'Password cannot be equal to the email address or username.' };
  }

  return { valid: true };
}
