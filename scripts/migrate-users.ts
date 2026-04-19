/**
 * Migrates users from the 'test' database to 'preptrack'
 * Run once: npx tsx scripts/migrate-users.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI!);

const testDb = mongoose.connection.useDb('test');
const preptrackDb = mongoose.connection.useDb('preptrack');

const testUsers = await testDb.collection('users').find({}).toArray();
console.log(`\nFound ${testUsers.length} users in 'test' database:`);
testUsers.forEach((u: any) => console.log(`  ${u.username} | ${u.email}`));

if (testUsers.length === 0) {
    console.log('Nothing to migrate.');
    await mongoose.disconnect();
    process.exit(0);
}

let migrated = 0;
let skipped = 0;

for (const user of testUsers) {
    const exists = await preptrackDb.collection('users').findOne({ email: user.email });
    if (exists) {
        console.log(`  ⏭  Skipping ${user.username} — already in preptrack`);
        skipped++;
        continue;
    }
    // Ensure isActive is set
    user.isActive = user.isActive !== false;
    await preptrackDb.collection('users').insertOne(user);
    console.log(`  ✅ Migrated ${user.username}`);
    migrated++;
}

console.log(`\nDone — migrated: ${migrated}, skipped: ${skipped}`);
await mongoose.disconnect();
