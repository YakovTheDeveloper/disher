import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { db } from '@/shared/lib/dexie/schema';
import { collectFoods, collectEvents } from '../api/runAnalysis';
import { streamDailyAnalysis, DailyStreamError } from './streamDailyAnalysis';
import { parseIdeaCardsFromMarkdown } from './parseIdeaCardsFromMarkdown';
import type { DailyAnalysis, DailyAnalysisReason } from './types';

// Daily-analysis store. Frontend-only: results live in idb-keyval keyed by
// date, never in Dexie and never in the backup snapshot (anti-goal: no
// cross-device sync for daily analyses).
//
// Persist is debounced — streaming fires onChunk many times a second and
// there is no point writing idb-keyval per chunk. Terminal transitions
// (done/failed/interrupted) flush immediately so a reload right after
// completion never loses the result.

const STORAGE_KEY = 'disher.daily-analyses';
const PERSIST_DEBOUNCE_MS = 400;
const MAX_AGE_DAYS = 30;

type ByDate = Record<string, DailyAnalysis>;

type DailyAnalysisState = {
  byDate: ByDate;
  /** True once idb-keyval has been read at boot. */
  hydrated: boolean;
  /** Snapshot the ticked hypotheses, hydrate the day, start the SSE stream. */
  start: (date: string, opts: { hypothesisIds: string[] }) => Promise<void>;
  /** Abort an in-flight stream and mark it interrupted (date-switch / reload).
   *  No-op when the date is not currently streaming. */
  interrupt: (date: string, reason: 'reload' | 'date-switch') => void;
  /** Delete a stored analysis. No-op while it is still streaming. */
  clear: (date: string) => void;
};

// In-memory only — AbortControllers are not serialisable and must not be
// persisted. One controller per actively-streaming date.
const controllers = new Map<string, AbortController>();

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persistNow(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  void idbSet(STORAGE_KEY, useDailyAnalysisStore.getState().byDate);
}

function persistDebounced(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void idbSet(STORAGE_KEY, useDailyAnalysisStore.getState().byDate);
  }, PERSIST_DEBOUNCE_MS);
}

// Age in whole days of a dd-MM-yyyy day key relative to `nowMs`. Returns null
// for an unparseable key.
export function dayAgeInDays(date: string, nowMs: number): number | null {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date);
  if (!m) return null;
  const dayMs = Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (Number.isNaN(dayMs)) return null;
  return Math.floor((nowMs - dayMs) / 86_400_000);
}

export const useDailyAnalysisStore = create<DailyAnalysisState>((set, get) => {
  // Merge a partial change into one date's record (no-op if it vanished).
  const patch = (date: string, mut: (a: DailyAnalysis) => DailyAnalysis) => {
    set((s) => {
      const cur = s.byDate[date];
      if (!cur) return s;
      return { byDate: { ...s.byDate, [date]: mut(cur) } };
    });
  };

  return {
    byDate: {},
    hydrated: false,

    start: async (date, { hypothesisIds }) => {
      // Replacing a record must abort the prior stream first — otherwise its
      // onChunk closure keeps appending into the fresh record.
      controllers.get(date)?.abort();
      controllers.delete(date);

      // Snapshot the ticked hypotheses from Dexie. An id deleted between the
      // tick and start() simply drops out.
      const rows = await db.hypotheses.bulkGet(hypothesisIds);
      const appliedHypotheses = rows
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .map((r) => ({ id: r.id, title: r.title, body: r.body }));

      // Hydrate the day's foods/events with human-readable names so the LLM
      // never sees product_id UUIDs.
      const [scheduleFoods, scheduleEvents] = await Promise.all([
        collectFoods([date]),
        collectEvents([date]),
      ]);

      const controller = new AbortController();
      controllers.set(date, controller);

      set((s) => ({
        byDate: {
          ...s.byDate,
          [date]: {
            date,
            resultMd: '',
            ideaCards: [],
            appliedHypotheses,
            createdAt: new Date().toISOString(),
            status: 'streaming',
            reason: null,
          },
        },
      }));
      persistNow();

      try {
        const resultMd = await streamDailyAnalysis({
          date,
          scheduleFoods,
          scheduleEvents,
          hypotheses: appliedHypotheses.map(({ title, body }) => ({
            title,
            body,
          })),
          signal: controller.signal,
          onChunk: (chunk) => {
            patch(date, (a) => ({ ...a, resultMd: a.resultMd + chunk }));
            persistDebounced();
          },
        });

        // An abort means interrupt() already owns the final state — leave it.
        if (controller.signal.aborted) return;

        patch(date, (a) => ({
          ...a,
          resultMd,
          ideaCards: parseIdeaCardsFromMarkdown(resultMd),
          status: 'done',
          reason: null,
        }));
        persistNow();
      } catch (err) {
        if (controller.signal.aborted) return;
        const reason: DailyAnalysisReason =
          err instanceof DailyStreamError ? err.kind : 'network';
        patch(date, (a) => ({ ...a, status: 'failed', reason }));
        persistNow();
      } finally {
        if (controllers.get(date) === controller) controllers.delete(date);
      }
    },

    interrupt: (date, reason) => {
      controllers.get(date)?.abort();
      controllers.delete(date);
      const cur = get().byDate[date];
      if (!cur || cur.status !== 'streaming') return;
      patch(date, (a) => ({ ...a, status: 'interrupted', reason }));
      persistNow();
    },

    clear: (date) => {
      const cur = get().byDate[date];
      // Guard: a clear mid-stream would let the next chunk recreate the row.
      if (!cur || cur.status === 'streaming') return;
      set((s) => {
        const next = { ...s.byDate };
        delete next[date];
        return { byDate: next };
      });
      persistNow();
    },
  };
});

// Boot-time hydration. Reads idb-keyval, flips any stream that was mid-flight
// at unload to `interrupted` (it cannot resume), and drops analyses older
// than 30 days. Must be called once at app boot before the UI reads the
// store. Idempotent — a second call (or a call after the store already has
// records) is a no-op and never clobbers in-memory state.
export async function hydrateDailyAnalyses(nowMs: number = Date.now()): Promise<void> {
  // Already hydrated — do not re-read or overwrite.
  if (useDailyAnalysisStore.getState().hydrated) return;

  let stored: ByDate | undefined;
  try {
    stored = await idbGet<ByDate>(STORAGE_KEY);
  } catch {
    stored = undefined;
  }

  const byDate: ByDate = {};
  for (const [date, analysis] of Object.entries(stored ?? {})) {
    const age = dayAgeInDays(date, nowMs);
    // Boot cleanup: drop entries strictly older than 30 days (exactly 30 stays).
    if (age !== null && age > MAX_AGE_DAYS) continue;
    byDate[date] =
      analysis.status === 'streaming'
        ? { ...analysis, status: 'interrupted', reason: 'reload' }
        : analysis;
  }

  // A stream started before this idb read resolved already wrote a record
  // into the store. The stored snapshot is stale relative to it — let the
  // in-memory record win so a just-started stream is not dropped on boot.
  const live = useDailyAnalysisStore.getState().byDate;
  for (const [date, analysis] of Object.entries(live)) {
    byDate[date] = analysis;
  }

  useDailyAnalysisStore.setState({ byDate, hydrated: true });
  void idbSet(STORAGE_KEY, byDate);
}
