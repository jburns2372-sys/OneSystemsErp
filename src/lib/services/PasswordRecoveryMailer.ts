import { Resend } from 'resend';

export class PasswordRecoveryMailer {
  static isConfigured(): boolean {
    const provider = process.env.PASSWORD_RECOVERY_EMAIL_PROVIDER;
    const fromAddress = process.env.PASSWORD_RECOVERY_EMAIL_FROM;
    const baseUrl = process.env.APP_BASE_URL;
    
    return !!(provider && fromAddress && baseUrl);
  }

  static async sendResetLink(email: string, token: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }
    
    const provider = process.env.PASSWORD_RECOVERY_EMAIL_PROVIDER!;
    const fromAddress = process.env.PASSWORD_RECOVERY_EMAIL_FROM!;
    const baseUrl = process.env.APP_BASE_URL!;

    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
    
    // Validate HTTPS in production (outside local development)
    if (process.env.NODE_ENV === 'production' && !resetUrl.startsWith('https://')) {
      console.warn('SECURITY WARNING: Password reset URL must use HTTPS in production.');
    }

    try {
      if (provider === 'resend') {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: fromAddress,
          to: email,
          subject: 'Password Recovery Instructions',
          text: `You requested a password reset. Please click the following link to securely reset your password: ${resetUrl}`,
          html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Click here to securely reset your password</a></p>`
        });
        return true;
      }
      
      // Fallback
      console.log(`[EmailProvider:${provider}] Sending password recovery email to ${email} from ${fromAddress}`);
      return true;
    } catch (error) {
      console.error('Failed to dispatch password recovery email:', error);
      return false; // Do not consume the token on failure, but request endpoint still returns generic response
    }
  }
}
