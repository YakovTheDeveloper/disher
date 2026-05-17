import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clear as idbClear, get as idbGet, set as idbSet } from 'idb-keyval';
import type { DailyAnalysis } from '../types';

// streamDailyAnalysis does real network — stub just that export. The real
// DailyStreamError class is kept (importActual) so the store's `instanceof`
// check and the errors thrown by this test refer to the same class.
vi.mock('../streamDailyAnalysis', async (importActual) => {
  const actual =
    await importActual<typeof import('../streamDailyAnalysis')>();
  return { ...actual, streamDailyAnalysis: vi.fn() };
});

import { streamDailyAnalysis, DailyStreamError } from '../streamDailyAnalysis';
import {
  useDailyAnalysisStore,
  hydrateDailyAnalyses,
  dayAgeInDays,
} from '../daily-analysis-store';

const STORAGE_KEY = 'disher.daily-analyses';
const mockStream = vi.mocked(streamDailyAnalysis);

function streamingRecord(date: string): DailyAnalysis {
  return {
    date,
    resultMd: 'partial…',
    ideaCards: [],
    appliedHypotheses: [],
    createdAt: '2026-05-15T10:00:00.000Z',
    status: 'streaming',
    reason: null,
  };
}

function doneRecord(date: string): DailyAnalysis {
  return { ...streamingRecord(date), status: 'done', resultMd: 'готово' };
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
  mockStream.mockReset();
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
  it('streams to done and parses idea-cards from the markdown tail', async () => {
    const md =
      'Разбор дня.\n\n## Идеи для эксперимента\n\n- **Ранний ужин** — до 19:00';
    mockStream.mockImplementation(async ({ onChunk }) => {
      onChunk(md);
      return md;
    });

    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    const rec = useDailyAnalysisStore.getState().byDate['15-05-2026'];
    expect(rec.status).toBe('done');
    expect(rec.reason).toBeNull();
    expect(rec.resultMd).toBe(md);
    expect(rec.ideaCards).toEqual([
      { title: 'Ранний ужин', body: 'до 19:00' },
    ]);
  });

  it('persists the finished analysis to idb-keyval', async () => {
    mockStream.mockResolvedValue('готово');
    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    await new Promise((r) => setTimeout(r, 0)); // let fire-and-forget idbSet land
    const stored = await idbGet<Record<string, DailyAnalysis>>(STORAGE_KEY);
    expect(stored?.['15-05-2026']?.status).toBe('done');
  });

  it('marks the analysis failed with the network reason on a network error', async () => {
    mockStream.mockRejectedValue(new DailyStreamError('network', 'offline'));
    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    const rec = useDailyAnalysisStore.getState().byDate['15-05-2026'];
    expect(rec.status).toBe('failed');
    expect(rec.reason).toBe('network');
  });

  it('marks the analysis failed with the server reason on a server error', async () => {
    mockStream.mockRejectedValue(new DailyStreamError('server', '500'));
    await useDailyAnalysisStore
      .getState()
      .start('15-05-2026', { hypothesisIds: [] });

    expect(useDailyAnalysisStore.getState().byDate['15-05-2026'].reason).toBe(
      'server',
    );
  });
});

describe('clear', () => {
  it('is a no-op while the analysis is still streaming', () => {
    useDailyAnalysisStore.setState({
      byDate: { '15-05-2026': streamingRecord('15-05-2026') },
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
  it('flips a streaming analysis to interrupted with the given reason', () => {
    useDailyAnalysisStore.setState({
      byDate: { '15-05-2026': streamingRecord('15-05-2026') },
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
  it('flips a stream that was mid-flight at unload to interrupted/reload', async () => {
    await idbSet(STORAGE_KEY, { '15-05-2026': streamingRecord('15-05-2026') });
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

  it('does not clobber an in-memory record written before the idb read', async () => {
    // idb holds a stale snapshot from a previous session…
    await idbSet(STORAGE_KEY, { '14-05-2026': doneRecord('14-05-2026') });
    // …but a stream already started and wrote a streaming record in-memory
    // before this boot read resolved.
    useDailyAnalysisStore.setState({
      byDate: { '15-05-2026': streamingRecord('15-05-2026') },
      hydrated: false,
    });
    await hydrateDailyAnalyses(NOW);

    const { byDate } = useDailyAnalysisStore.getState();
    // The in-flight stream survives — it is NOT replaced by the stale snapshot.
    expect(byDate['15-05-2026']?.status).toBe('streaming');
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
