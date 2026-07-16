import { describe, it, expect, vi, beforeEach } from 'vitest';

const authedFetchMock = vi.fn();
vi.mock('@/shared/lib/api/base', () => ({ API_BASE: 'https://api.test' }));
vi.mock('@/shared/lib/api/authedFetch', () => ({
  authedFetch: (...args: unknown[]) => authedFetchMock(...args),
}));
vi.mock('@/shared/lib/observability/pwaTag', () => ({ getPwaTag: () => 'pwa-tag' }));

import { submitUserReport } from './submitUserReport';

// readApiError falls back to the X-Request-Id header when the body carries no
// `instance`, so a non-ok mock has to answer headers.get().
const noHeaders = { get: () => null } as unknown as Headers;

beforeEach(() => {
  authedFetchMock.mockReset();
});

describe('submitUserReport', () => {
  it('POSTs to the trailing-slash prod route with the collected payload', async () => {
    authedFetchMock.mockResolvedValue({ ok: true });
    await submitUserReport('something broke');

    expect(authedFetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = authedFetchMock.mock.calls[0] as [string, RequestInit];
    // Trailing slash matters: the route is `post('/')` under prefix
    // `/api/user-reports` with Fastify ignoreTrailingSlash:false.
    expect(url).toBe('https://api.test/api/user-reports/');
    expect(opts.method).toBe('POST');
    expect(String(opts.headers && (opts.headers as Record<string, string>)['Content-Type'])).toContain(
      'application/json',
    );

    const body = JSON.parse(opts.body as string);
    expect(body.text).toBe('something broke');
    expect(body.pwa).toBe('pwa-tag');
    expect(typeof body.page).toBe('string');
    expect(typeof body.screenSize).toBe('string');
    expect(typeof body.userAgent).toBe('string');
  });

  it('throws the server error message on a legacy {error} response', async () => {
    authedFetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      headers: noHeaders,
      json: async () => ({ error: 'text is required' }),
    });
    await expect(submitUserReport('x')).rejects.toThrow('text is required');
  });

  // The reason this fetcher moved to throwApiError: reading `{error}` by hand
  // missed problem+json entirely, so every 401/403/500 — and, once the route
  // carries a schema, every 400 — surfaced to the user as a bare "HTTP <code>".
  it('reads the problem+json shape the error handler returns', async () => {
    authedFetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      headers: noHeaders,
      json: async () => ({
        status: 400,
        code: 'bad_request',
        title: 'Bad Request',
        detail: 'text is required',
        instance: 'req-42',
      }),
    });
    await expect(submitUserReport('x')).rejects.toThrow('text is required');
  });

  it('falls back to the HTTP status when the error body has no message', async () => {
    authedFetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      headers: noHeaders,
      json: async () => ({}),
    });
    await expect(submitUserReport('x')).rejects.toThrow('HTTP 500');
  });
});
