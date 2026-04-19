import 'dotenv/config';
import mongoose from 'mongoose';

async function run() {
    const uri = process.env.MONGODB_URI!;
    await mongoose.connect(uri);
    const db = mongoose.connection.db!;
    const col = db.collection('users');

    // 1. Backfill isActive: true on users that don't have the field
    const r1 = await col.updateMany(
        { isActive: { $exists: false } },
        { $set: { isActive: true } }
    );
    console.log(`✅ Backfilled isActive:true on ${r1.modifiedCount} users`);

    // 2. Re-activate any accidentally deactivated users
    const r2 = await col.updateMany(
        { isActive: false },
        { $set: { isActive: true } }
    );
    console.log(`✅ Re-activated ${r2.modifiedCount} deactivated users`);

    // 3. Show final state
    const users = await col.find({}, { projection: { username: 1, email: 1, isActive: 1, _id: 0 } }).toArray();
    console.log(`\n📋 All users (${users.length} total):`);
    users.forEach(u => console.log(`   ${u.username} | ${u.email} | isActive: ${u.isActive}`));

    await mongoose.disconnect();
    console.log('\n✅ Done');
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
