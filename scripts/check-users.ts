import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI!);
const users = await mongoose.connection.db!
    .collection('users')
    .find({}, { projection: { username: 1, email: 1, isActive: 1, _id: 0 } })
    .toArray();

console.log(`\nTotal users in DB: ${users.length}`);
users.forEach(u => console.log(`  ${u.username} | ${u.email} | isActive: ${u.isActive}`));
await mongoose.disconnect();
