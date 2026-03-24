/**
 * Central configuration for API calls.
 * This determines whether the frontend calls a local or remote backend.
 */

// Use VITE_API_BASE_URL from environment variables.
// In production (Vercel), you MUST set VITE_API_BASE_URL to "https://your-backend.onrender.com"
export const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Optional configuration for separate code execution backend if needed.
// Fallback to API_BASE if not provided.
export const CODE_EXECUTION_BASE = import.meta.env.VITE_CODE_EXECUTION_URL || API_BASE;

console.log(`[API] Base URL configured as: ${API_BASE}`);
console.log(`[API] Code Execution URL configured as: ${CODE_EXECUTION_BASE}`);
