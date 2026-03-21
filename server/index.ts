import 'dotenv/config';
import app from './app.js';
import { storageReady } from './storage.js';


const PORT = Number(process.env.PORT) || 3001;

async function start() {
  console.log('\n🚀 Starting DSA Progress Tracker server...');
  console.log(`   NODE_ENV  : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT      : ${PORT}`);
  console.log(`   MongoDB   : ${process.env.MONGODB_URI ? '✓ URI present' : '✗ not set — using file storage'}`);
  console.log(`   OpenRouter: ${process.env.OPENROUTER_API_KEY ? '✓ key present' : '✗ not set — AI analysis disabled'}`);

  // Wait for storage to fully initialise (MongoDB connect or file load)
  // This prevents the race condition where early requests hit an empty StorageProxy
  try {
    const storage = await storageReady;
    console.log('   MongoDB   : ✅ MongoDB Connected');
    console.log('   Storage   : ✓ Ready (StorageProxy operational)\n');
  } catch (err: any) {
    console.error('   MongoDB   : ❌ MongoDB Connection Failed —', err?.message);
    console.error('   Fallback  : ⚠️ System running in localized mode (File Storage)');
    console.error('   Admin     : ⚠️ High-level analytics will use fallback/mock data\n');
  }

  const server = app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use.`);
      console.error(`   Kill the process using it:  npx kill-port ${PORT}`);
      console.error(`   Or change PORT in your .env file.\n`);
    } else {
      console.error('❌ Server error:', err);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch(err => {
  console.error('❌ Fatal startup error:', err);
  process.exit(1);
});