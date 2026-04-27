import { supabase } from '@/shared/api/supabase-client';

/**
 * Build an Authorization header from the current Supabase session.
 * Returns an empty object if no session is available — the backend will
 * reject the request with 401, which lets the call site decide how to react.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
