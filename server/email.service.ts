/**
 * email.service.ts
 * AlgoAscent Email Service — Brevo Transactional API (HTTPS)
 *
 * Design principles:
 * - Direct HTTPS API calls via official Brevo SDK (sib-api-v3-sdk)
 * - Eliminates SMTP connection timeouts on Render
 * - Never throws — all errors caught and logged
 * - Fire-and-forget at call site (non-blocking)
 * - Clean architecture with singleton API client
 */

import * as SibApiV3Sdk from 'sib-api-v3-sdk';
import crypto from 'crypto';

import { 
    welcomeTemplate, 
    passwordResetTemplate, 
    emailVerificationTemplate, 
    accountDeactivatedTemplate, 
    accountActivatedTemplate,
    assessmentAssignedTemplate,
    paymentReceiptTemplate
} from './email.templates.js';
import { PasswordResetTokenModel } from './models.js';

// ── API Configuration ────────────────────────────────────────────────────────
const defaultClient = (SibApiV3Sdk as any).default.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];

let _apiInstance: any = null;

function getApiInstance(): any {
    const key = (process.env.BREVO_API_KEY || '').replace(/['"]/g, '').trim();
    if (!key) return null;

    if (!_apiInstance) {
        apiKey.apiKey = key;
        _apiInstance = new (SibApiV3Sdk as any).default.TransactionalEmailsApi();
    }
    return _apiInstance;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFromDetails() {
    const fromStr = (process.env.EMAIL_FROM || '').replace(/['"]/g, '').trim() 
        || 'AlgoAscent <a88762001@smtp-brevo.com>';
    
    // Parse "Name <email@domain.com>"
    const match = fromStr.match(/(.*)<(.*)>/);
    if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
    }
    return { name: 'AlgoAscent', email: fromStr };
}

function getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'https://progresss-tracker.vercel.app';
}

// ── Startup Diagnostics ──────────────────────────────────────────────────────
setImmediate(() => {
    console.log('\n📧 [email] Initializing Brevo Transactional API Service...');
    const api = getApiInstance();
    if (api) {
        console.log('   ✅ API Client Ready (HTTPS mode)');
    } else {
        console.warn('   ⚠️  BREVO_API_KEY missing — Email service disabled');
    }
    console.log('');
});

// ── Core Delivery Logic ──────────────────────────────────────────────────────

interface SendOptions {
    to: string;
    subject: string;
    html: string;
    tag: string;
}

async function send(opts: SendOptions): Promise<boolean> {
    const api = getApiInstance();
    if (!api) {
        console.warn(`[email:${opts.tag}] Skip: No API Key`);
        return false;
    }

    const from = getFromDetails();
    console.log(`[email:${opts.tag}] API Request → ${opts.to} | Subject: ${opts.subject}`);

    const sendSmtpEmail = new (SibApiV3Sdk as any).default.SendSmtpEmail();
    sendSmtpEmail.sender = from;
    sendSmtpEmail.to = [{ email: opts.to }];
    sendSmtpEmail.subject = opts.subject;
    sendSmtpEmail.htmlContent = opts.html;

    try {
        const data = await api.sendTransacEmail(sendSmtpEmail);
        console.log(`[email:${opts.tag}] ✅ Success (MessageID: ${data.messageId || 'API_ACCEPTED'})`);
        return true;
    } catch (err: any) {
        console.error(`[email:${opts.tag}] ❌ API Error → ${opts.to}`);
        console.error(`[email:${opts.tag}]    Reason: ${err?.response?.body?.message || err?.message || err}`);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API (Fire-and-forget)
// ─────────────────────────────────────────────────────────────────────────────

export function isEmailEnabled(): boolean {
    return !!(process.env.BREVO_API_KEY);
}

export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    return send({
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

    try {
        await PasswordResetTokenModel.deleteMany({ email });
        await PasswordResetTokenModel.create({ email, token: hashedToken, expiresAt });
    } catch (e) {
        console.error('[email:password-reset] Database error:', e);
    }

    const resetUrl = `${getFrontendUrl()}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    return send({
        to: email,
        subject: 'Reset your AlgoAscent password',
        html: passwordResetTemplate(username, resetUrl),
        tag: 'password-reset',
    });
}

export async function sendVerificationEmail(email: string, username: string): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const verifyUrl = `${getFrontendUrl()}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

    send({
        to: email,
        subject: 'Verify your AlgoAscent email address',
        html: emailVerificationTemplate(username, verifyUrl),
        tag: 'verify-email',
    });
}

export async function sendAccountDeactivatedEmail(email: string, username: string): Promise<boolean> {
    return send({
        to: email,
        subject: 'Your AlgoAscent account has been deactivated',
        html: accountDeactivatedTemplate(username),
        tag: 'account-deactivated',
    });
}

export async function sendAccountActivatedEmail(email: string, username: string): Promise<boolean> {
    return send({
        to: email,
        subject: 'Your AlgoAscent account has been reactivated',
        html: accountActivatedTemplate(username),
        tag: 'account-activated',
    });
}

export async function sendAssessmentAssignedEmail(
    email: string,
    username: string,
    assessmentTitle: string,
    durationMinutes: number,
    questionCount: number,
    deadlineFormatted: string | null,
    shareToken: string
): Promise<boolean> {
    const frontendUrl = getFrontendUrl();
    const assessmentUrl = `${frontendUrl}/assessment/${shareToken}`;
    return send({
        to: email,
        subject: `New Assessment Assigned: ${assessmentTitle}`,
        html: assessmentAssignedTemplate(
            username,
            assessmentTitle,
            durationMinutes,
            questionCount,
            deadlineFormatted,
            assessmentUrl
        ),
        tag: 'assessment-assigned',
    });
}

export async function sendPaymentReceiptEmail(
    email: string,
    username: string,
    planName: string,
    amount: number,
    orderId: string,
    paymentId: string,
    expiresAtFormatted: string
): Promise<boolean> {
    const dateFormatted = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    return send({
        to: email,
        subject: `Payment Receipt: Welcome to ${planName} 👑`,
        html: paymentReceiptTemplate(
            username,
            planName,
            amount,
            orderId,
            paymentId,
            dateFormatted,
            expiresAtFormatted
        ),
        tag: 'payment-receipt',
    });
}

// Token Verification Helpers (Unchanged)
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
