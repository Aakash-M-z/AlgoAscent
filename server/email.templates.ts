/**
 * email.templates.ts
 * All HTML email templates for AlgoAscent.
 * Each template is a pure function — no side effects, easy to test.
 */

const APP_NAME = 'AlgoAscent';
const GOLD = '#D4AF37';
const BG = '#0a0a0a';
const CARD_BG = '#111111';
const TEXT = '#EAEAEA';
const MUTED = '#888888';
const BORDER = '#222222';

/** Shared wrapper — consistent header/footer across all emails */
function layout(content: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'https://progresss-tracker.vercel.app';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- Logo -->
        <tr><td style="padding-bottom:28px;text-align:center;">
          <span style="font-size:22px;font-weight:900;color:${GOLD};letter-spacing:-0.5px;">◈ ${APP_NAME}</span>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:16px;padding:36px 32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:${MUTED};line-height:1.6;">
            © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
            <a href="${frontendUrl}" style="color:${GOLD};text-decoration:none;">${frontendUrl.replace('https://', '')}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Reusable CTA button */
function ctaButton(href: string, label: string): string {
    return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr><td align="center">
    <a href="${href}"
       style="display:inline-block;background:${GOLD};color:#0B0B0B;font-weight:700;font-size:14px;
              padding:13px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.02em;">
      ${label}
    </a>
  </td></tr>
</table>`;
}

/** Divider */
const divider = `<hr style="border:0;border-top:1px solid ${BORDER};margin:24px 0;" />`;

// ─────────────────────────────────────────────────────────────────────────────
// WELCOME EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export function welcomeTemplate(username: string): string {
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://progresss-tracker.vercel.app'}/dashboard`;

    const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${TEXT};">
      Welcome, ${username} 👋
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:${MUTED};line-height:1.6;">
      You've joined <strong style="color:${GOLD};">${APP_NAME}</strong> — your AI-powered DSA learning platform.
      Let's get you to your first solve.
    </p>

    <!-- Feature list -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#0d0d0d;border:1px solid ${BORDER};border-radius:12px;padding:20px 24px;margin-bottom:8px;">
      <tr><td>
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:${MUTED};
                  text-transform:uppercase;letter-spacing:0.1em;">What's waiting for you</p>
        ${[
            ['◈', 'AI-powered progress analysis and recommendations'],
            ['◐', 'Mock interviews — DSA, System Design, OS, OOP, CN'],
            ['◆', 'XP system, badges, and streak tracking'],
            ['▦', 'Analytics dashboard with activity heatmap'],
        ].map(([icon, text]) => `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
          <span style="color:${GOLD};font-size:14px;flex-shrink:0;margin-top:1px;">${icon}</span>
          <span style="font-size:14px;color:${TEXT};line-height:1.5;">${text}</span>
        </div>`).join('')}
      </td></tr>
    </table>

    ${ctaButton(dashboardUrl, 'Open Your Dashboard →')}
    ${divider}
    <p style="margin:0;font-size:12px;color:${MUTED};text-align:center;line-height:1.6;">
      If you didn't create this account, you can safely ignore this email.
    </p>`;

    return layout(content);
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET EMAIL
// ─────────────────────────────────────────────────────────────────────────────
export function passwordResetTemplate(username: string, resetUrl: string): string {
    const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${TEXT};">
      Reset your password
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:${MUTED};line-height:1.6;">
      Hi <strong style="color:${TEXT};">${username}</strong>, we received a request to reset your
      <strong style="color:${GOLD};">${APP_NAME}</strong> password.
    </p>

    <!-- Warning box -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);
                  border-radius:10px;padding:14px 18px;margin-bottom:4px;">
      <tr><td>
        <p style="margin:0;font-size:13px;color:${GOLD};line-height:1.6;">
          ⏱ This link expires in <strong>15 minutes</strong> and can only be used once.
        </p>
      </td></tr>
    </table>

    ${ctaButton(resetUrl, 'Reset Password')}

    <!-- Fallback URL -->
    <p style="margin:0 0 4px;font-size:12px;color:${MUTED};">
      If the button doesn't work, copy and paste this URL:
    </p>
    <p style="margin:0 0 24px;font-size:11px;color:${MUTED};word-break:break-all;">
      ${resetUrl}
    </p>

    ${divider}
    <p style="margin:0;font-size:12px;color:${MUTED};text-align:center;line-height:1.6;">
      If you didn't request a password reset, ignore this email — your password won't change.<br/>
      For security questions, contact us at support@algoscent.com
    </p>`;

    return layout(content);
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFICATION (optional flow)
// ─────────────────────────────────────────────────────────────────────────────
export function emailVerificationTemplate(username: string, verifyUrl: string): string {
    const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${TEXT};">
      Verify your email
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:${MUTED};line-height:1.6;">
      Hi <strong style="color:${TEXT};">${username}</strong>, one quick step to activate your
      <strong style="color:${GOLD};">${APP_NAME}</strong> account.
    </p>

    ${ctaButton(verifyUrl, 'Verify Email Address')}

    <p style="margin:0 0 4px;font-size:12px;color:${MUTED};text-align:center;">
      Link expires in 24 hours.
    </p>
    ${divider}
    <p style="margin:0;font-size:12px;color:${MUTED};text-align:center;">
      If you didn't sign up for ${APP_NAME}, ignore this email.
    </p>`;

    return layout(content);
}
