import { Resend } from 'resend';

type VerifiedMailerConfiguration = {
  readonly fromAddress: string;
  readonly resetOrigin: string;
  readonly apiKey: string;
};

function getVerifiedMailerConfiguration(): VerifiedMailerConfiguration | null {
  // No imaginary/fallback provider: an unsupported provider is unconfigured.
  const provider = (process.env.PASSWORD_RECOVERY_EMAIL_PROVIDER ?? '').trim().toLowerCase();
  const fromAddress = process.env.PASSWORD_RECOVERY_EMAIL_FROM?.trim() ?? '';
  const baseUrl = process.env.APP_BASE_URL?.trim() ?? '';
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  if (provider !== 'resend' || !fromAddress || !baseUrl || !apiKey) return null;

  try {
    const url = new URL(baseUrl);
    const isLocalDevelopment =
      process.env.NODE_ENV !== 'production' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    if (url.protocol !== 'https:' && !(isLocalDevelopment && url.protocol === 'http:')) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    return { fromAddress, resetOrigin: url.origin, apiKey };
  } catch {
    return null;
  }
}

export class PasswordRecoveryMailer {
  static isConfigured(): boolean {
    return getVerifiedMailerConfiguration() !== null;
  }

  /**
   * true means the provider accepted the send request; it is not proof of inbox
   * delivery. Never return true for an unsupported provider or Resend API error.
   */
  static async sendResetLink(email: string, token: string): Promise<boolean> {
    const configuration = getVerifiedMailerConfiguration();
    if (!configuration) return false;
    if (!/^[a-f0-9]{64}$/i.test(token)) return false;

    const resetUrl = new URL('/reset-password', configuration.resetOrigin);
    resetUrl.searchParams.set('token', token);
    const href = resetUrl.toString();

    try {
      const resend = new Resend(configuration.apiKey);
      const result = await resend.emails.send({
        from: configuration.fromAddress,
        to: email,
        subject: 'OneSystemsERP password recovery',
        text: `You requested a password reset. Open this link to set a new password: ${href}`,
        html: `<p>You requested a password reset.</p><p><a href="${href}">Reset your password</a></p>`,
      });
      // Resend may resolve successfully with { error } rather than throwing.
      if (result.error || !result.data?.id) {
        console.error('PASSWORD_RECOVERY_PROVIDER_REJECTED');
        return false;
      }
      return true;
    } catch {
      // Deliberately omit recipient, token, reset URL, or provider payload.
      console.error('PASSWORD_RECOVERY_PROVIDER_UNAVAILABLE');
      return false;
    }
  }
}
