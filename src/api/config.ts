/**
 * API_BASE is intentionally empty — all /api/* routes are same-origin (Vercel).
 * CODE_EXEC_BASE points to the separate Render code execution service.
 */
export const API_BASE = '';

export const CODE_EXEC_BASE: string = import.meta.env.VITE_CODE_EXECUTION_URL ?? '';

if (!CODE_EXEC_BASE) {
    console.warn('[config] VITE_CODE_EXECUTION_URL is not set — code execution will fail');
}
