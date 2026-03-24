import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a welcome email to the newly registered user.
 * Silently logs any error to ensure the signup process does not break.
 */
export async function sendWelcomeEmail(userEmail: string, username: string) {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_key') {
      console.warn('[Email] RESEND_API_KEY is not configured. Email not sent.');
      return;
    }

    const { data, error } = await resend.emails.send({
      from: 'Progress Tracker <onboarding@resend.dev>',
      to: [userEmail],
      subject: 'Welcome to Progress Tracker 🚀',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: 900; color: #D4AF37; text-transform: uppercase; letter-spacing: -1px;">
              PrepTrack <span style="color: #000;">AI</span>
            </div>
          </div>
          
          <h1 style="font-size: 22px; font-weight: 800; margin-bottom: 20px; color: #000;">Welcome, ${username}!</h1>
          
          <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 25px;">
            We're thrilled to have you join Progress Tracker. You've just taken the first step towards mastering Data Structures and Algorithms with the power of AI.
          </p>
          
          <div style="background: #f9f9f9; border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #eee;">
            <h2 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; color: #888;">What's next?</h2>
            <ul style="padding-left: 20px; margin-bottom: 0; color: #555;">
              <li style="margin-bottom: 10px;">Track your daily DSA solves</li>
              <li style="margin-bottom: 10px;">Get AI-powered insights on your progress</li>
              <li style="margin-bottom: 10px;">Practice with AI Mock Interviews</li>
              <li>Compete on the leaderboard and earn badges</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
               style="background-color: #000; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
               Start Tracking Progress 🚀
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;">
          
          <p style="font-size: 12px; color: #888; text-align: center;">
            Track your journey. Secure your future. <br>
            © 2026 PrepTrack AI. All rights reserved.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[Email] Failed to send welcome email:', error);
    } else {
      console.log('[Email] Welcome email sent successfully to:', userEmail);
    }
  } catch (err) {
    console.error('[Email] Unexpected error in sendWelcomeEmail:', err);
  }
}
