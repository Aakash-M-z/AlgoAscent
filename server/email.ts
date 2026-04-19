/**
 * email.ts — backwards-compatibility re-export.
 * All email logic now lives in email.service.ts + email.templates.ts.
 * This file keeps existing imports (app.ts) working without changes.
 */
export { sendWelcomeEmail } from './email.service.js';
