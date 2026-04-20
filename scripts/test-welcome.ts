import 'dotenv/config';
import { sendWelcomeEmail } from '../server/email.service.js';

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ present' : '❌ MISSING');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('\nCalling sendWelcomeEmail...');

await sendWelcomeEmail('aakashext@gmail.com', 'TestUser');
console.log('Done');
