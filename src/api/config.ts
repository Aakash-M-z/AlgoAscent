/**
 * Central configuration for API calls.
 * This determines whether the frontend calls a local or remote backend.
 */

// Use VITE_API_BASE_URL from environment variables, or fallback to an empty string for relative calls.
// In production (Vercel), you MUST set VITE_API_BASE_URL to "https://your-backend.onrender.com"
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

console.log(`[API] Base URL configured as: ${API_BASE}`);
