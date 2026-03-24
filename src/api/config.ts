/**
 * Central configuration for API calls.
 * This determines whether the frontend calls a local or remote backend.
 */

// Use VITE_API_BASE_URL from environment variables, or fallback to an empty string.
// An empty string defaults calls to the current domain (e.g. for local dev or Vercel proxying).
// Ensure this is set to your Render backend URL in the Vercel dashboard.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Optional configuration for separate code execution backend if needed.
export const CODE_EXECUTION_BASE = import.meta.env.VITE_CODE_EXECUTION_URL || API_BASE;

console.log(`[API] Base URL configured as: ${API_BASE}`);
