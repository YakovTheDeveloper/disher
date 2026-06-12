import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { requestDailyAnalysis, DailyStreamError } from '../requestDailyAnalysis';

const mockFetch = vi.mocked(authedFetch);

// Minimal Response stand-in: requestDailyAnalysis touches ok/status/json/text.
function fakeResponse(opts: {
  ok?: boolean;
  status?: number;
  json?: unknown;
}): Response {
  const { ok = true, status = 200, json } = opts;
  return {
    ok,
    status,
    json: async () => json,
    text: async () => JSON.stringify(json ?? {}),
  } as unknown as Response;
}

const okBody = {
  analysis: {
    summary: 'Разбор дня.',
    insights: [
      {
        title: 'Поздний ужин',
        detail: 'после 21:00',
        strength: 'weak',
        evidence: { days: ['15-05-2026'] },
      },
    ],
    hypotheses: [{ title: 'Без кофе', body: 'убрать кофе', suggestedDays: 7 }],
  },
};

const baseArgs = () => ({
  date: '15-05-2026',
  scheduleFoods: [],
  scheduleEvents: [],
  nutrients: [],
  hypotheses: [],
  signal: new AbortController().signal,
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe('requestDailyAnalysis — success', () => {
  it('returns the parsed {summary, insights, hypotheses}', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ json: okBody }));
    const result = await requestDailyAnalysis(baseArgs());
    expect(result.summary).toBe('Разбор дня.');
    expect(result.insights).toHaveLength(1);
    expect(result.hypotheses).toEqual([
      { title: 'Без кофе', body: 'убрать кофе', suggestedDays: 7 },
    ]);
  });

  it('drops an insight with no evidence.days (grounding gate)', async () => {
    mockFetch.mockResolvedValue(
      fakeResponse({
        json: {
          analysis: {
            summary: 's',
            insights: [{ title: 't', detail: 'd', strength: 'clear', evidence: {} }],
            hypotheses: [],
          },
        },
      }),
    );
    const result = await requestDailyAnalysis(baseArgs());
    expect(result.insights).toEqual([]);
  });

  it('sends only {title,body} hypotheses — no id in the POST body', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ json: okBody }));
    await requestDailyAnalysis({
      ...baseArgs(),
      hypotheses: [{ title: 'Без кофе', body: 'убрать кофе' }],
    });
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body.hypotheses).toEqual([{ title: 'Без кофе', body: 'убрать кофе' }]);
    expect(body.date).toBe('15-05-2026');
  });

  it('forwards the nutrient anchor lines in the POST body', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ json: okBody }));
    const nutrients = [{ name: 'Белки', amount: 95, unit: 'г', norm: 51 }];
    await requestDailyAnalysis({ ...baseArgs(), nutrients });
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body.nutrients).toEqual(nutrients);
  });

  it('includes userMessage in the POST body when provided', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ json: okBody }));
    await requestDailyAnalysis({
      ...baseArgs(),
      userMessage: 'без сахара после обеда',
    });
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body.userMessage).toBe('без сахара после обеда');
  });

  it('sends a fresh X-Request-Id header on the POST (idempotency key)', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ json: okBody }));
    await requestDailyAnalysis(baseArgs());
    const headers = mockFetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['X-Request-Id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

describe('requestDailyAnalysis — failure classification', () => {
  it('classifies an HTTP 5xx response as a `server` error', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ ok: false, status: 500 }));
    const err = await requestDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('server');
  });

  it('classifies an HTTP 4xx (e.g. 401) response as a `server` error', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ ok: false, status: 401 }));
    const err = await requestDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('server');
  });

  it('classifies an HTTP 402 response as a `payment` error with the RU message', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ ok: false, status: 402 }));
    const err = await requestDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('payment');
    expect(err.message).toBe('Недостаточно средств — пополните баланс');
  });

  it('classifies a fetch throw (offline) as a `network` error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await requestDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('network');
  });

  it('rejects on a malformed response body (missing summary)', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ json: { analysis: {} } }));
    const err = await requestDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('server');
  });
});

describe('requestDailyAnalysis — abort', () => {
  it('re-throws the original abort error (not a DailyStreamError) so the store bails quietly', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
    mockFetch.mockRejectedValue(abortErr);
    const err = await requestDailyAnalysis({
      ...baseArgs(),
      signal: controller.signal,
    }).catch((e) => e);
    expect(err).not.toBeInstanceOf(DailyStreamError);
    expect(err.name).toBe('AbortError');
  });
});
