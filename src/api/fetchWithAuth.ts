/**
 * fetchWithAuth.ts
 * Drop-in fetch wrapper that handles 401 ACCOUNT_DEACTIVATED globally.
 *
 * When the backend returns { error: 'ACCOUNT_DEACTIVATED' }:
 * - Clears the local session
 * - Shows a toast (if available)
 * - Redirects to /login
 *
 * Usage: replace fetch(...) with fetchWithAuth(...) in API calls
 * that require authentication.
 */

import { SessionManager } from '../utils/sessionManager';

const DEACTIVATED_KEY = 'account_deactivated_msg';

/**
 * Intercepts 401 responses and forces logout if account was deactivated.
 * Passes all other responses through unchanged.
 */
export async function fetchWithAuth(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    const res = await fetch(input, init);

    if (res.status === 401) {
        // Clone before reading body — response body can only be consumed once
        const clone = res.clone();
        try {
            const data = await clone.json();
            if (data?.error === 'ACCOUNT_DEACTIVATED') {
                handleDeactivation(data.message);
                // Return the original response so callers don't crash
                return res;
            }
        } catch {
            // Body wasn't JSON — not a deactivation response, pass through
        }
    }

    return res;
}

function handleDeactivation(message?: string) {
    // Store message so login page can display it after redirect
    const msg = message || 'Your account has been deactivated. Please contact support.';
    sessionStorage.setItem(DEACTIVATED_KEY, msg);

    // Clear all local auth state
    SessionManager.clearSession();

    // Redirect — use replace so back button doesn't return to protected page
    window.location.replace('/');
}

/**
 * Call this on the login/landing page to show the deactivation message.
 * Returns the message and clears it (one-time display).
 */
export function consumeDeactivationMessage(): string | null {
    const msg = sessionStorage.getItem(DEACTIVATED_KEY);
    if (msg) sessionStorage.removeItem(DEACTIVATED_KEY);
    return msg;
}
