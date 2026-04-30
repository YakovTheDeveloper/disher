import { authProvider } from '@/shared/lib/auth/authProvider';

/**
 * Build an Authorization header from the current session.
 * Returns an empty object if no session is available — the backend will
 * reject the request with 401, which lets the call site decide how to react.
 *
 * Prefer `authedFetch` for new code — it composes the header into the
 * fetch call directly. This helper exists for legacy call sites
 * (entities/analytics) that build headers manually for a fetch with extra
 * options.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await authProvider.getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
