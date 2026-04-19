import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI!);
const admin = mongoose.connection.db!.admin();
const dbs = await admin.listDatabases();
console.log('\nAll databases on this Atlas cluster:');
dbs.databases.forEach((db: any) => console.log(`  ${db.name} (${(db.sizeOnDisk / 1024).toFixed(1)} KB)`));

// Check if dhileepantv exists anywhere
for (const db of dbs.databases) {
    if (['admin', 'local', 'config'].includes(db.name)) continue;
    const conn = mongoose.connection.useDb(db.name);
    try {
        const users = await conn.collection('users').find(
            { username: 'dhileepantv' },
            { projection: { username: 1, email: 1, isActive: 1 } }
        ).toArray();
        if (users.length > 0) console.log(`\nFound dhileepantv in DB: ${db.name}`, users);
    } catch { }
}

await mongoose.disconnect();
