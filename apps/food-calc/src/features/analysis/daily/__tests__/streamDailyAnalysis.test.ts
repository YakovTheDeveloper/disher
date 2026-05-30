import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/api/authedFetch', () => ({ authedFetch: vi.fn() }));

import { authedFetch } from '@/shared/lib/api/authedFetch';
import { streamDailyAnalysis, DailyStreamError } from '../streamDailyAnalysis';

const mockFetch = vi.mocked(authedFetch);

function token(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

// Minimal Response stand-in: streamDailyAnalysis only touches ok/status/body/text.
function fakeResponse(opts: {
  ok?: boolean;
  status?: number;
  frames?: string[];
  noBody?: boolean;
  text?: string;
}): Response {
  const { ok = true, status = 200, frames = [], noBody = false, text } = opts;
  const enc = new TextEncoder();
  const body = noBody
    ? null
    : new ReadableStream<Uint8Array>({
        start(controller) {
          for (const f of frames) controller.enqueue(enc.encode(f));
          controller.close();
        },
      });
  return {
    ok,
    status,
    body,
    text: async () => text ?? frames.join(''),
  } as unknown as Response;
}

const baseArgs = () => ({
  date: '15-05-2026',
  scheduleFoods: [],
  scheduleEvents: [],
  nutrients: [],
  hypotheses: [],
  onChunk: () => {},
  signal: new AbortController().signal,
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe('streamDailyAnalysis — success', () => {
  it('accumulates streamed content and returns the full markdown', async () => {
    mockFetch.mockResolvedValue(
      fakeResponse({ frames: [token('Разбор '), token('дня.'), 'data: [DONE]\n\n'] }),
    );
    const chunks: string[] = [];
    const result = await streamDailyAnalysis({
      ...baseArgs(),
      onChunk: (c) => chunks.push(c),
    });
    expect(chunks).toEqual(['Разбор ', 'дня.']);
    expect(result).toBe('Разбор дня.');
  });

  it('falls back to text() when the response has no streamable body', async () => {
    mockFetch.mockResolvedValue(
      fakeResponse({ noBody: true, text: `${token('iOS путь')}data: [DONE]\n\n` }),
    );
    const result = await streamDailyAnalysis(baseArgs());
    expect(result).toBe('iOS путь');
  });

  it('sends only {title,body} hypotheses — no id in the POST body', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ frames: ['data: [DONE]\n\n'] }));
    await streamDailyAnalysis({
      ...baseArgs(),
      hypotheses: [{ title: 'Без кофе', body: 'убрать кофе' }],
    });
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body.hypotheses).toEqual([{ title: 'Без кофе', body: 'убрать кофе' }]);
    expect(body.date).toBe('15-05-2026');
  });

  it('forwards the nutrient anchor lines in the POST body', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ frames: ['data: [DONE]\n\n'] }));
    const nutrients = [{ name: 'Белки', amount: 95, unit: 'г', norm: 51 }];
    await streamDailyAnalysis({ ...baseArgs(), nutrients });
    const body = JSON.parse(String(mockFetch.mock.calls[0]?.[1]?.body));
    expect(body.nutrients).toEqual(nutrients);
  });
});

describe('streamDailyAnalysis — failure classification', () => {
  it('classifies an HTTP 5xx response as a `server` error', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ ok: false, status: 500, text: 'boom' }));
    const err = await streamDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('server');
  });

  it('classifies an HTTP 4xx (e.g. 401) response as a `server` error', async () => {
    mockFetch.mockResolvedValue(fakeResponse({ ok: false, status: 401, text: 'no session' }));
    const err = await streamDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('server');
  });

  it('classifies a fetch throw (offline) as a `network` error', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await streamDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('network');
  });

  it('classifies a server `event: error` frame as a `server` error', async () => {
    mockFetch.mockResolvedValue(
      fakeResponse({ frames: ['event: error\n', 'data: "upstream down"\n\n'] }),
    );
    const err = await streamDailyAnalysis(baseArgs()).catch((e) => e);
    expect(err).toBeInstanceOf(DailyStreamError);
    expect(err.kind).toBe('server');
    expect(err.message).toBe('upstream down');
  });
});

describe('streamDailyAnalysis — abort', () => {
  it('returns the partial text quietly (no throw) when the signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    mockFetch.mockRejectedValue(
      Object.assign(new Error('aborted'), { name: 'AbortError' }),
    );
    const result = await streamDailyAnalysis({
      ...baseArgs(),
      signal: controller.signal,
    });
    expect(result).toBe('');
  });
});
