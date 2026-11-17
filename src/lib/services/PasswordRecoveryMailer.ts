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
  const deploymentHost = process.env.VERCEL_URL?.trim().toLowerCase() ?? '';
  const deploymentBranch = process.env.VERCEL_GIT_COMMIT_REF?.trim() ?? '';
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? '';
  if (provider !== 'resend' || !/^re_[A-Za-z0-9_-]{16,}$/.test(apiKey)) return null;
  const mailbox = fromAddress.includes('<') ? fromAddress.match(/^[^<>\r\n]+<([^<>\r\n]+)>$/)?.[1] : fromAddress;
  if (!mailbox || /[\r\n]/.test(fromAddress) || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(mailbox) || /@resend\.dev$/i.test(mailbox)) return null;

  // Reset links must target this exact security-branch Preview deployment,
  // not the accepted release-branch Preview or any caller-supplied domain.
  if (process.env.VERCEL_ENV !== 'preview'
    || deploymentBranch !== 'fix/oserp-p8-auth-security-closeout'
    || !/^[a-z0-9-]+\.vercel\.app$/.test(deploymentHost)) return null;
  try {
    const trustedOrigin = `https://${deploymentHost}`;
    if (baseUrl) {
      const url = new URL(baseUrl);
      if (url.origin !== trustedOrigin || url.protocol !== 'https:'
        || url.username || url.password || url.search || url.hash
        || url.port || url.pathname !== '/') return null;
    }
    return { fromAddress, resetOrigin: trustedOrigin, apiKey };
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
  static async dispatchResetLink(email: string, token: string): Promise<{ accepted: boolean; providerId: string | null }> {
    const configuration = getVerifiedMailerConfiguration();
    const failure = { accepted: false, providerId: null };
    if (!configuration) return failure;
    if (!/^[a-f0-9]{64}$/i.test(token)) return failure;

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
      if (result.error || typeof result.data?.id !== 'string' || !result.data.id) {
        console.error('PASSWORD_RECOVERY_PROVIDER_REJECTED');
        return failure;
      }
      return { accepted: true, providerId: result.data.id };
    } catch {
      // Deliberately omit recipient, token, reset URL, or provider payload.
      console.error('PASSWORD_RECOVERY_PROVIDER_UNAVAILABLE');
      return failure;
    }
  }

  static async sendResetLink(email: string, token: string): Promise<boolean> {
    return (await this.dispatchResetLink(email, token)).accepted;
  }
}
