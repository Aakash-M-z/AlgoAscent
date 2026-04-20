/**
 * email.service.ts
 * Brevo SMTP via Nodemailer — drop-in replacement for Resend.
 *
 * Design principles:
 * - Never throws — all errors caught and logged
 * - Never blocks the calling request — fire-and-forget at call site
 * - Reads env vars at call time to avoid dotenv race condition
 * - Transporter is lazily created and reused (singleton)
 */

import nodemailer, { Transporter } from 'nodemailer';
import crypto from 'crypto';
import { welcomeTemplate, passwordResetTemplate, emailVerificationTemplate, accountDeactivatedTemplate, accountActivatedTemplate } from './email.templates.js';
import { PasswordResetTokenModel } from './models.js';

// ── Transporter singleton — Gmail or Brevo, selected by env ──────────────────
let _transporter: Transporter | null = null;
let _transporterKey: string | undefined;

function getTransporter(): Transporter {
    // Gmail takes priority if EMAIL_USER is set
    const key = process.env.EMAIL_USER ?? process.env.BREVO_SMTP_USER;
    if (!_transporter || key !== _transporterKey) {
        if (process.env.EMAIL_USER) {
            _transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,  // Gmail App Password (not account password)
                },
            });
        } else {
            _transporter = nodemailer.createTransport({
                host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
                port: Number(process.env.BREVO_SMTP_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.BREVO_SMTP_USER,
                    pass: process.env.BREVO_SMTP_PASS,
                },
                connectionTimeout: 10_000,
                greetingTimeout: 5_000,
                socketTimeout: 10_000,
            });
        }
        _transporterKey = key;
    }
    return _transporter;
}

// ── Verify SMTP on startup (non-blocking) ─────────────────────────────────────
setImmediate(() => {
    const provider = process.env.EMAIL_USER ? 'Gmail' : 'Brevo';
    const ready = process.env.EMAIL_USER
        ? !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
        : !!(process.env.BREVO_SMTP_USER && process.env.BREVO_SMTP_PASS);
    if (!ready) return;
    getTransporter().verify()
        .then(() => console.log(`[email] ✅ SMTP connection verified (${provider})`))
        .catch(err => console.error(`[email] ❌ SMTP verification failed (${provider}):`, err?.message));
});

// ── Read at call time — never at module load ──────────────────────────────────
function getFromAddress(): string {
    return process.env.EMAIL_FROM
        || (process.env.EMAIL_USER ? `AlgoAscent <${process.env.EMAIL_USER}>` : 'AlgoAscent <a88762001@smtp-brevo.com>');
}

function getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'https://progresss-tracker.vercel.app';
}

// ── Guard — skip if SMTP not configured ──────────────────────────────────────
function isEmailEnabled(): boolean {
    // Gmail takes priority
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return true;
    // Brevo fallback
    const user = process.env.BREVO_SMTP_USER;
    const pass = process.env.BREVO_SMTP_PASS;
    if (!user || !pass || user.trim() === '' || pass.trim() === '') {
        console.warn('[email] ⚠️  No email credentials configured — email skipped');
        return false;
    }
    return true;
}

// ── Core send helper ──────────────────────────────────────────────────────────
interface SendOptions {
    to: string;
    subject: string;
    html: string;
    tag: string;
}

async function send(opts: SendOptions): Promise<boolean> {
    if (!isEmailEnabled()) return false;

    const from = getFromAddress();

    console.log(`[email:${opts.tag}] Sending → ${opts.to} | Subject: ${opts.subject}`);

    try {
        const info = await getTransporter().sendMail({
            from,
            to: opts.to,
            subject: opts.subject,
            html: opts.html,
        });

        console.log(`[email:${opts.tag}] ✅ Sent → ${opts.to} | messageId: ${info.messageId}`);
        return true;
    } catch (err: any) {
        console.error(`[email:${opts.tag}] ❌ Failed → ${opts.to}`);
        console.error(`[email:${opts.tag}]    Error: ${err?.message ?? err}`);
        // Reset transporter so next call gets a fresh connection
        _transporter = null;
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API — identical signatures to the old Resend service
// ─────────────────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
    await send({
        to: email,
        subject: `Welcome to AlgoAscent, ${username}! 🚀`,
        html: welcomeTemplate(username),
        tag: 'welcome',
    });
}

export async function sendPasswordResetEmail(email: string, username: string): Promise<boolean> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetTokenModel.deleteMany({ email });
    await PasswordResetTokenModel.create({ email, token: hashedToken, expiresAt });

    const resetUrl = `${getFrontendUrl()}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    return send({
        to: email,
        subject: 'Reset your AlgoAscent password',
        html: passwordResetTemplate(username, resetUrl),
        tag: 'password-reset',
    });
}

export async function verifyPasswordResetToken(rawToken: string, email: string): Promise<string | null> {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = await PasswordResetTokenModel.findOne({
        email,
        token: hashedToken,
        expiresAt: { $gt: new Date() },
    });
    return record ? record.email : null;
}

export async function consumePasswordResetToken(rawToken: string, email: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    await PasswordResetTokenModel.deleteOne({ email, token: hashedToken });
}

export async function sendVerificationEmail(email: string, username: string): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const verifyUrl = `${getFrontendUrl()}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await send({
        to: email,
        subject: 'Verify your AlgoAscent email address',
        html: emailVerificationTemplate(username, verifyUrl),
        tag: 'verify-email',
    });
}

/**
 * Send account deactivation notification.
 * Called after admin deactivates a user.
 */
export async function sendAccountDeactivatedEmail(email: string, username: string): Promise<void> {
    await send({
        to: email,
        subject: 'Your AlgoAscent account has been deactivated',
        html: accountDeactivatedTemplate(username),
        tag: 'account-deactivated',
    });
}

/**
 * Send account activation notification.
 * Called after admin reactivates a user.
 */
export async function sendAccountActivatedEmail(email: string, username: string): Promise<void> {
    await send({
        to: email,
        subject: 'Your AlgoAscent account has been reactivated',
        html: accountActivatedTemplate(username),
        tag: 'account-activated',
    });
}
