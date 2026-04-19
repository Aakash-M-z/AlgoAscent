/**
 * DB health check — verifies all migrations are applied correctly.
 * Run: npx tsx scripts/verify-db.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

await mongoose.connect(process.env.MONGODB_URI!);
const db = mongoose.connection.db!;

console.log('\n🔍 AlgoAscent — Database Verification\n' + '─'.repeat(50));

let passed = 0;
let failed = 0;

function ok(msg: string) { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg: string) { console.log(`  ❌ ${msg}`); failed++; }
function info(msg: string) { console.log(`  ℹ️  ${msg}`); }

// ── 1. Users collection ───────────────────────────────────────────────────────
console.log('\n👥 Users');
const users = await db.collection('users').find({}).toArray();
info(`Total users: ${users.length}`);

for (const u of users) {
    const issues: string[] = [];

    // isActive field
    if (u.isActive === undefined || u.isActive === null)
        issues.push('isActive missing');
    else if (u.isActive === false)
        issues.push('isActive=false (deactivated)');

    // Password hashed
    if (!u.password)
        issues.push('no password');
    else if (!u.password.startsWith('$2b$') && !u.password.startsWith('$2a$'))
        issues.push('password NOT hashed (plain text)');

    // Required fields
    if (!u.email) issues.push('missing email');
    if (!u.username) issues.push('missing username');
    if (!u.role) issues.push('missing role');

    if (issues.length === 0) {
        ok(`${u.username} (${u.email}) — all fields OK`);
    } else {
        fail(`${u.username} (${u.email}) — ${issues.join(', ')}`);
    }
}

// ── 2. Password reset tokens ──────────────────────────────────────────────────
console.log('\n🔐 Password Reset Tokens');
const tokens = await db.collection('passwordresettokens').find({}).toArray();
const expiredTokens = tokens.filter(t => new Date(t.expiresAt) < new Date());
info(`Total tokens: ${tokens.length}`);
if (expiredTokens.length > 0) {
    info(`Expired tokens: ${expiredTokens.length} (will be auto-deleted by MongoDB TTL)`);
} else {
    ok('No expired tokens');
}

// ── 3. Activities ─────────────────────────────────────────────────────────────
console.log('\n📊 Activities');
const actCount = await db.collection('activities').countDocuments();
info(`Total activities: ${actCount}`);
ok('Activities collection accessible');

// ── 4. Indexes ────────────────────────────────────────────────────────────────
console.log('\n📑 Indexes');
const userIndexes = await db.collection('users').indexes();
const hasEmailIdx = userIndexes.some(i => i.key?.email);
const hasUsernameIdx = userIndexes.some(i => i.key?.username);
const hasIsActiveIdx = userIndexes.some(i => i.key?.isActive);

hasEmailIdx ? ok('users.email index exists') : fail('users.email index MISSING — add for performance');
hasUsernameIdx ? ok('users.username index exists') : fail('users.username index MISSING');
hasIsActiveIdx ? ok('users.isActive index exists') : info('users.isActive index not set (optional)');

// ── 5. Bcrypt verification spot-check ─────────────────────────────────────────
console.log('\n🔑 Bcrypt Spot-check');
const adminUser = users.find(u => u.role === 'admin');
if (adminUser) {
    const isHash = adminUser.password?.startsWith('$2b$') || adminUser.password?.startsWith('$2a$');
    isHash ? ok(`Admin "${adminUser.username}" password is bcrypt hashed`) : fail(`Admin "${adminUser.username}" password is NOT hashed`);
} else {
    info('No admin user found');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`\n📋 Result: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
    console.log('⚠️  Run the relevant migration scripts to fix failures:\n');
    console.log('   npx tsx scripts/fix-isactive.ts    — fix isActive field');
    console.log('   npx tsx scripts/hash-passwords.ts  — hash plain-text passwords');
    console.log('   npx tsx scripts/migrate-users.ts   — migrate users from test DB\n');
} else {
    console.log('✅ All migrations verified. Database is healthy.\n');
}

await mongoose.disconnect();
