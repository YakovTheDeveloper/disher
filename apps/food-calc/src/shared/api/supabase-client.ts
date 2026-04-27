import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in env');
}

const FETCH_TIMEOUT_MS = 15_000;

const timedFetch: typeof fetch = (input, init) => {
  const userSignal = init?.signal;
  const timeoutSignal = AbortSignal.timeout(FETCH_TIMEOUT_MS);
  const signal =
    userSignal && typeof AbortSignal.any === 'function'
      ? AbortSignal.any([userSignal, timeoutSignal])
      : (userSignal ?? timeoutSignal);
  return fetch(input, { ...init, signal });
};

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: { fetch: timedFetch },
});
