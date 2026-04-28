import type { Page, Route } from '@playwright/test';

export type SupabaseMode = 'ok' | 'fail-5xx' | 'fail-4xx';

const fakeJwt =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJlMmUtdXNlciIsInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.sig';

const fakeUser = {
  id: 'e2e-user',
  aud: 'authenticated',
  role: 'authenticated',
  email: null,
  is_anonymous: true,
  app_metadata: { provider: 'anonymous', providers: ['anonymous'] },
  user_metadata: {},
  identities: [],
  created_at: '2026-04-27T00:00:00.000Z',
};

const fakeSession = {
  access_token: fakeJwt,
  refresh_token: 'fake-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: fakeUser,
};

type State = {
  mode: SupabaseMode;
  restCalls: Array<{ url: string; method: string; body?: unknown }>;
};

const STATE_KEY = '__supabaseMockState';

export async function installSupabaseMock(page: Page, mode: SupabaseMode = 'ok'): Promise<void> {
  const state: State = { mode, restCalls: [] };
  // Stash on a property of `page` for cross-call access.
  (page as unknown as Record<string, unknown>)[STATE_KEY] = state;

  await page.route('**/e2e-mock.supabase.co/auth/v1/**', async (route: Route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/token') || url.includes('/auth/v1/signup')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeSession),
      });
    }
    if (url.includes('/auth/v1/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeUser),
      });
    }
    if (url.includes('/auth/v1/logout')) {
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeSession),
    });
  });

  await page.route('**/e2e-mock.supabase.co/rest/v1/**', async (route: Route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();
    let body: unknown;
    try {
      body = req.postData() ? JSON.parse(req.postData() as string) : undefined;
    } catch {
      body = req.postData();
    }
    state.restCalls.push({ url, method, body });

    if (state.mode === 'fail-5xx') {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'simulated server error' }),
      });
    }
    if (state.mode === 'fail-4xx') {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'simulated client error' }),
      });
    }

    // GET → empty array (no catalog needed for these tests).
    if (method === 'GET' || method === 'HEAD') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Content-Range': '*/0' },
        body: JSON.stringify([]),
      });
    }
    // POST/PATCH/DELETE/upsert → echo payload as success.
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'Content-Range': '0-0/1' },
      body: JSON.stringify(Array.isArray(body) ? body : body ? [body] : []),
    });
  });
}

export function setSupabaseMode(page: Page, mode: SupabaseMode): void {
  const state = (page as unknown as Record<string, State>)[STATE_KEY];
  if (state) state.mode = mode;
}

export function getRestCalls(page: Page): Array<{ url: string; method: string; body?: unknown }> {
  const state = (page as unknown as Record<string, State>)[STATE_KEY];
  return state ? state.restCalls : [];
}

export function resetRestCalls(page: Page): void {
  const state = (page as unknown as Record<string, State>)[STATE_KEY];
  if (state) state.restCalls = [];
}
