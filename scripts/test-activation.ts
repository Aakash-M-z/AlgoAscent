import 'dotenv/config';
import { sendAccountActivatedEmail } from '../server/email.service.js';

console.log('Sending account activation email...');
await sendAccountActivatedEmail('aakashext@gmail.com', 'aakashext');
console.log('Done');
