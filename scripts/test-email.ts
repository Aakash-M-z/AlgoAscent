/**
 * scripts/test-email.ts
 * Standalone Brevo SMTP email delivery test.
 *
 * Usage:
 *   npx tsx scripts/test-email.ts your@email.com
 *   npx tsx scripts/test-email.ts your@email.com --type=reset
 */

import 'dotenv/config';
import nodemailer from 'nodemailer';

const to = process.argv[2];
const type = process.argv.find(a => a.startsWith('--type='))?.split('=')[1] ?? 'welcome';

if (!to || !to.includes('@')) {
    console.error('Usage: npx tsx scripts/test-email.ts your@email.com [--type=welcome|reset]');
    process.exit(1);
}

console.log('\n🔍 Brevo SMTP Email Diagnostics');
console.log('─'.repeat(50));
console.log(`  BREVO_SMTP_HOST : ${process.env.BREVO_SMTP_HOST ?? '❌ not set'}`);
console.log(`  BREVO_SMTP_PORT : ${process.env.BREVO_SMTP_PORT ?? '❌ not set'}`);
console.log(`  BREVO_SMTP_USER : ${process.env.BREVO_SMTP_USER ? '✅ present' : '❌ MISSING'}`);
console.log(`  BREVO_SMTP_PASS : ${process.env.BREVO_SMTP_PASS ? '✅ present' : '❌ MISSING'}`);
console.log(`  EMAIL_FROM      : ${process.env.EMAIL_FROM ?? '⚠️  not set — using default'}`);
console.log(`  Sending to      : ${to}`);
console.log('─'.repeat(50) + '\n');

if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
    console.error('❌ BREVO_SMTP_USER or BREVO_SMTP_PASS missing. Check your .env file.');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.BREVO_SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
});

const from = process.env.EMAIL_FROM || 'AlgoAscent <noreply@algoscent.com>';

const subjects: Record<string, string> = {
    welcome: 'Test: Welcome to AlgoAscent 🚀',
    reset: 'Test: Reset your AlgoAscent password',
};

const bodies: Record<string, string> = {
    welcome: `<div style="font-family:sans-serif;padding:24px;background:#111;color:#eee;border-radius:12px">
        <h2 style="color:#D4AF37">✅ Email delivery test — Welcome</h2>
        <p>This is a test email from AlgoAscent via Brevo SMTP.</p>
        <p>If you received this, your Nodemailer + Brevo integration is working correctly.</p>
        <p style="color:#888;font-size:12px">Sent at: ${new Date().toISOString()}</p>
    </div>`,
    reset: `<div style="font-family:sans-serif;padding:24px;background:#111;color:#eee;border-radius:12px">
        <h2 style="color:#D4AF37">✅ Email delivery test — Password Reset</h2>
        <p>This is a test password reset email from AlgoAscent via Brevo SMTP.</p>
        <p style="color:#888;font-size:12px">Sent at: ${new Date().toISOString()}</p>
    </div>`,
};

async function run() {
    console.log('📤 Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('✅ SMTP connection verified\n');
    } catch (err: any) {
        console.error('❌ SMTP connection failed:', err?.message);
        console.error('\n💡 Common causes:');
        console.error('   • Wrong BREVO_SMTP_USER or BREVO_SMTP_PASS');
        console.error('   • SMTP key not generated in Brevo dashboard');
        console.error('   • Go to: https://app.brevo.com/settings/keys/smtp');
        process.exit(1);
    }

    console.log('📤 Sending test email...\n');
    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject: subjects[type] ?? subjects.welcome,
            html: bodies[type] ?? bodies.welcome,
        });

        console.log('✅ Email sent successfully!');
        console.log(`   Message ID : ${info.messageId}`);
        console.log(`   To         : ${to}`);
        console.log(`   From       : ${from}`);
        console.log('\n📬 Check your inbox (including spam/promotions)\n');
    } catch (err: any) {
        console.error('❌ Send failed:', err?.message);
        process.exit(1);
    }
}

run();
