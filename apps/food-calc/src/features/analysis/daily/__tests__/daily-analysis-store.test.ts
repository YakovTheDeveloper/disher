import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clear as idbClear, get as idbGet, set as idbSet } from 'idb-keyval';
import type { DailyAnalysis } from '../types';

// requestDailyAnalysis does real network — stub just that export. The real
// DailyStreamError class is kept (importActual) so the store's `instanceof`
// check and the errors thrown by this test refer to the same class.
vi.mock('../requestDailyAnalysis', async (importActual) => {
  const actual =
    await importActual<typeof import('../requestDailyAnalysis')>();
  return { ...actual, requestDailyAnalysis: vi.fn() };
});

import { requestDailyAnalysis, DailyStreamError } from '../requestDailyAnalysis';
import {
  useDailyAnalysisStore,
  hydrateDailyAnalyses,
  dayAgeInDays,
} from '../daily-analysis-store';

const STORAGE_KEY = 'disher.daily-analyses';
const mockRequest = vi.mocked(requestDailyAnalysis);

function loadingRecord(date: string): DailyAnalysis {
  return {
    date,
    summary: '',
    insights: [],
    hypotheses: [],
    appliedHypotheses: [],
    createdAt: '2026-05-15T10:00:00.000Z',
    status: 'loading',
    reason: null,
  };
}

function doneRecord(date: string): DailyAnalysis {
  return { ...loadingRecord(date), status: 'done', summary: 'готово' };
}

// dd-MM-yyyy key `offsetDays` before `2026-05-15`.
function dayKey(offsetDays: number): string {
  const ms = Date.UTC(2026, 4, 15) - offsetDays * 86_400_000;
  const d = new Date(ms);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getUTCFullYear()}`;
}
const NOW = Date.UTC(2026, 4, 15, 12, 0, 0);

beforeEach(async () => {
  await idbClear();
  useDailyAnalysisStore.setState({ byDate: {}, hydrated: false });
  mockRequest.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('dayAgeInDays', () => {
  it('counts whole days between a dd-MM-yyyy key and now', () => {
    expect(dayAgeInDays('15-05-2026', NOW)).toBe(0);
    expect(dayAgeInDays('05-05-2026', NOW)).toBe(10);
  });

  it('returns null for an unparseable key', () => {
    expect(dayAgeInDays('2026-05-15', NOW)).toBeNull();
    expect(dayAgeInDays('garbage', NOW)).toBeNull();
  });
});

describe('start', () => {
  it('resolves to done with summary / insights / hypotheses', async () => {
    mockRequest.mockResolvedValue({
      summary: 'Разбор дня.',
      insights: [
        {
          title: 'Ранний ужин',
          detail: 'до 19:00',
          strength: 'weak',
          evidence: { days: ['15-05-2026'] },
        },
      ],
      hypotheses: [{ title: 'Без сахара', body: 'на день' }],
    });

    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    const rec = useDailyAnalysisStore.getState().byDate['15-05-2026'];
    expect(rec.status).toBe('done');
    expect(rec.reason).toBeNull();
    expect(rec.summary).toBe('Разбор дня.');
    expect(rec.insights).toHaveLength(1);
    expect(rec.hypotheses).toEqual([{ title: 'Без сахара', body: 'на день' }]);
  });

  it('persists the finished analysis to idb-keyval', async () => {
    mockRequest.mockResolvedValue({ summary: 'готово', insights: [], hypotheses: [] });
    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    await new Promise((r) => setTimeout(r, 0)); // let fire-and-forget idbSet land
    const stored = await idbGet<Record<string, DailyAnalysis>>(STORAGE_KEY);
    expect(stored?.['15-05-2026']?.status).toBe('done');
  });

  it('marks the analysis failed with the network reason on a network error', async () => {
    mockRequest.mockRejectedValue(new DailyStreamError('network', 'offline'));
    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    const rec = useDailyAnalysisStore.getState().byDate['15-05-2026'];
    expect(rec.status).toBe('failed');
    expect(rec.reason).toBe('network');
  });

  it('marks the analysis failed with the server reason on a server error', async () => {
    mockRequest.mockRejectedValue(new DailyStreamError('server', '500'));
    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    expect(useDailyAnalysisStore.getState().byDate['15-05-2026'].reason).toBe(
      'server',
    );
  });

  it('threads userMessage to the request and snapshots it on the record', async () => {
    mockRequest.mockResolvedValue({ summary: 'готово', insights: [], hypotheses: [] });
    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [], userMessage: 'учти сон' });

    expect(mockRequest).toHaveBeenCalledWith(
      expect.objectContaining({ userMessage: 'учти сон' }),
    );
    const rec = useDailyAnalysisStore.getState().byDate['15-05-2026'];
    expect(rec.appliedUserMessage).toBe('учти сон');
  });

  it('leaves appliedUserMessage undefined when no message is given', async () => {
    mockRequest.mockResolvedValue({ summary: 'готово', insights: [], hypotheses: [] });
    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    expect(
      useDailyAnalysisStore.getState().byDate['15-05-2026'].appliedUserMessage,
    ).toBeUndefined();
  });
});

describe('clear', () => {
  it('is a no-op while the analysis is still loading', () => {
    useDailyAnalysisStore.setState({
      byDate: { '15-05-2026': loadingRecord('15-05-2026') },
    });
    useDailyAnalysisStore.getState().clear('15-05-2026');
    expect(
      useDailyAnalysisStore.getState().byDate['15-05-2026'],
    ).toBeDefined();
  });

  it('removes a finished analysis', () => {
    useDailyAnalysisStore.setState({
      byDate: { '15-05-2026': doneRecord('15-05-2026') },
    });
    useDailyAnalysisStore.getState().clear('15-05-2026');
    expect(
      useDailyAnalysisStore.getState().byDate['15-05-2026'],
    ).toBeUndefined();
  });
});

describe('interrupt', () => {
  it('flips a loading analysis to interrupted with the given reason', () => {
    useDailyAnalysisStore.setState({
      byDate: { '15-05-2026': loadingRecord('15-05-2026') },
    });
    useDailyAnalysisStore.getState().interrupt('15-05-2026', 'date-switch');
    const rec = useDailyAnalysisStore.getState().byDate['15-05-2026'];
    expect(rec.status).toBe('interrupted');
    expect(rec.reason).toBe('date-switch');
  });

  it('does not touch an already-finished analysis', () => {
    useDailyAnalysisStore.setState({
      byDate: { '15-05-2026': doneRecord('15-05-2026') },
    });
    useDailyAnalysisStore.getState().interrupt('15-05-2026', 'date-switch');
    expect(useDailyAnalysisStore.getState().byDate['15-05-2026'].status).toBe(
      'done',
    );
  });
});

describe('hydrateDailyAnalyses', () => {
  it('flips a request that was in flight at unload to interrupted/reload', async () => {
    await idbSet(STORAGE_KEY, { '15-05-2026': loadingRecord('15-05-2026') });
    await hydrateDailyAnalyses(NOW);

    const rec = useDailyAnalysisStore.getState().byDate['15-05-2026'];
    expect(rec.status).toBe('interrupted');
    expect(rec.reason).toBe('reload');
    expect(useDailyAnalysisStore.getState().hydrated).toBe(true);
  });

  it('drops analyses older than 30 days but keeps the exact-30-day boundary', async () => {
    await idbSet(STORAGE_KEY, {
      [dayKey(0)]: doneRecord(dayKey(0)),
      [dayKey(30)]: doneRecord(dayKey(30)),
      [dayKey(31)]: doneRecord(dayKey(31)),
    });
    await hydrateDailyAnalyses(NOW);

    const { byDate } = useDailyAnalysisStore.getState();
    expect(byDate[dayKey(0)]).toBeDefined();
    expect(byDate[dayKey(30)]).toBeDefined(); // exactly 30 days — kept
    expect(byDate[dayKey(31)]).toBeUndefined(); // 31 days — dropped
  });

  it('leaves done analyses untouched', async () => {
    await idbSet(STORAGE_KEY, { '15-05-2026': doneRecord('15-05-2026') });
    await hydrateDailyAnalyses(NOW);
    expect(useDailyAnalysisStore.getState().byDate['15-05-2026'].status).toBe(
      'done',
    );
  });

  it('normalizes a pre-structured-output record (old {resultMd, ideaCards, streaming}) so it cannot crash the render', async () => {
    // Shape written by the streaming-era build — no summary/insights/hypotheses.
    const oldShape = {
      date: '15-05-2026',
      resultMd: '## разбор\nкэшированный текст',
      ideaCards: [{ title: 'идея', body: 'тело' }],
      appliedHypotheses: [],
      createdAt: '2026-05-15T10:00:00.000Z',
      status: 'streaming',
      reason: null,
    } as unknown as DailyAnalysis;
    await idbSet(STORAGE_KEY, { '15-05-2026': oldShape });
    await hydrateDailyAnalyses(NOW);

    const rec = useDailyAnalysisStore.getState().byDate['15-05-2026'];
    // Old resultMd carried over to summary; insights/hypotheses defaulted to [].
    expect(rec.summary).toBe('## разбор\nкэшированный текст');
    expect(rec.insights).toEqual([]);
    expect(rec.hypotheses).toEqual([]);
    // Dead 'streaming' status mapped to interrupted/reload.
    expect(rec.status).toBe('interrupted');
    expect(rec.reason).toBe('reload');
  });

  it('does not clobber an in-memory record written before the idb read', async () => {
    // idb holds a stale snapshot from a previous session…
    await idbSet(STORAGE_KEY, { '14-05-2026': doneRecord('14-05-2026') });
    // …but a request already started and wrote a loading record in-memory
    // before this boot read resolved.
    useDailyAnalysisStore.setState({
      byDate: { '15-05-2026': loadingRecord('15-05-2026') },
      hydrated: false,
    });
    await hydrateDailyAnalyses(NOW);

    const { byDate } = useDailyAnalysisStore.getState();
    // The in-flight request survives — it is NOT replaced by the stale snapshot.
    expect(byDate['15-05-2026']?.status).toBe('loading');
    // The stored record is still merged in alongside it.
    expect(byDate['14-05-2026']?.status).toBe('done');
  });

  it('is a no-op once the store is already hydrated', async () => {
    useDailyAnalysisStore.setState({ byDate: {}, hydrated: true });
    await idbSet(STORAGE_KEY, { '15-05-2026': doneRecord('15-05-2026') });
    await hydrateDailyAnalyses(NOW);
    // A second call must not re-read idb and overwrite live state.
    expect(
      useDailyAnalysisStore.getState().byDate['15-05-2026'],
    ).toBeUndefined();
  });
});
