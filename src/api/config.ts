/**
 * Central configuration for API calls.
 * This determines whether the frontend calls a local or remote backend.
 */

// Use VITE_API_BASE_URL from environment variables, or fallback to /api for relative calls.
// In production (Vercel), you MUST set VITE_API_BASE_URL to your Render backend URL.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

console.log(`[API] Base URL configured as: ${API_BASE}`);
