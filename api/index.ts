// Vercel serverless entry point.
// server/index.ts never runs here — load dotenv explicitly so
// process.env vars are available when app.ts initialises.
import 'dotenv/config';
import app from '../server/app.js';

export default app;
