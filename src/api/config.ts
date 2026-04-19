/**
 * Central API configuration.
 *
 * Local dev:  API_BASE = '' (Vite proxy forwards /api/* to localhost:3001)
 * Production: API_BASE = VITE_API_BASE_URL (Render backend)
 *
 * Set in Vercel dashboard → Environment Variables:
 *   VITE_API_BASE_URL = https://algoascent-tbg9.onrender.com
 *   VITE_CODE_EXECUTION_URL = https://code-execution-backend-qq01.onrender.com
 */

export const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

export const CODE_EXEC_BASE: string = import.meta.env.VITE_CODE_EXECUTION_URL ?? '';

if (import.meta.env.DEV) {
    console.log(`[config] API_BASE: ${API_BASE || '(empty — using Vite proxy)'}`);
    console.log(`[config] CODE_EXEC_BASE: ${CODE_EXEC_BASE || '(not set)'}`);
}
