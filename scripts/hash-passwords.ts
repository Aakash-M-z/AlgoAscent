/**
 * One-time migration: hash all plain-text passwords in MongoDB.
 * Safe to run multiple times — skips already-hashed passwords.
 *
 * Run: npx tsx scripts/hash-passwords.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

await mongoose.connect(process.env.MONGODB_URI!);
const col = mongoose.connection.db!.collection('users');

const users = await col.find({}, { projection: { _id: 1, username: 1, password: 1 } }).toArray();
console.log(`\nFound ${users.length} users to check\n`);

let hashed = 0;
let skipped = 0;

for (const user of users) {
    const pwd = user.password as string;
    if (!pwd) { console.log(`  ⚠️  ${user.username} — no password, skipping`); skipped++; continue; }
    if (pwd.startsWith('$2b$') || pwd.startsWith('$2a$')) {
        console.log(`  ✓  ${user.username} — already hashed`);
        skipped++;
        continue;
    }
    const hash = await bcrypt.hash(pwd, 12);
    await col.updateOne({ _id: user._id }, { $set: { password: hash } });
    console.log(`  ✅ ${user.username} — hashed`);
    hashed++;
}

console.log(`\nDone — hashed: ${hashed}, skipped: ${skipped}\n`);
await mongoose.disconnect();
