import 'dotenv/config';
import { sendAccountDeactivatedEmail } from '../server/email.service.js';

console.log('Sending account deactivation email...');
await sendAccountDeactivatedEmail('aakashext@gmail.com', 'aakashext');
console.log('Done');
