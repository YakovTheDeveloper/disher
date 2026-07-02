import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { db } from '@/shared/lib/dexie/schema';
import toaster from '@/shared/lib/toaster/toaster';
import { collectFoods, collectEvents, collectNutrientsByDay } from '../api/runAnalysis';
import { analysisFailureToast } from '../analysisErrorMessage';
import { requestDailyAnalysis, DailyStreamError } from './requestDailyAnalysis';
import type { DailyAnalysis, DailyAnalysisReason } from './types';

// Daily-analysis store. Frontend-only: results live in idb-keyval keyed by
// date, never in Dexie and never in the backup snapshot (anti-goal: no
// cross-device sync for daily analyses).
//
// Single-request (no longer streaming): start() fires one POST and awaits the
// structured {summary, insights, hypotheses} contract. While in flight the
// record sits at status 'loading'; the terminal transition (done/failed/
// interrupted) persists immediately so a reload never loses the result.

const STORAGE_KEY = 'disher.daily-analyses';
const MAX_AGE_DAYS = 30;

type ByDate = Record<string, DailyAnalysis>;

type DailyAnalysisState = {
  byDate: ByDate;
  /** True once idb-keyval has been read at boot. */
  hydrated: boolean;
  /** Snapshot the ticked hypotheses, hydrate the day, request the analysis.
   *  `userMessage` is optional free-text «уточнения от пользователя». */
  start: (
    date: string,
    opts: { hypothesisIds: string[]; userMessage?: string },
  ) => Promise<void>;
  /** Abort an in-flight request and mark it interrupted (date-switch / reload).
   *  No-op when the date is not currently loading. */
  interrupt: (date: string, reason: 'reload' | 'date-switch') => void;
  /** Delete a stored analysis. No-op while it is still loading. */
  clear: (date: string) => void;
};

// In-memory only — AbortControllers are not serialisable and must not be
// persisted. One controller per actively-loading date.
const controllers = new Map<string, AbortController>();

function persistNow(): void {
  void idbSet(STORAGE_KEY, useDailyAnalysisStore.getState().byDate);
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

    start: async (date, { hypothesisIds, userMessage }) => {
      // Replacing a record must abort the prior request first.
      controllers.get(date)?.abort();
      controllers.delete(date);

      // Snapshot the ticked hypotheses from Dexie. An id deleted between the
      // tick and start() simply drops out.
      const rows = await db.hypotheses.bulkGet(hypothesisIds);
      const appliedHypotheses = rows
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .map((r) => ({ id: r.id, title: r.title, body: r.body }));

      // Hydrate the day's foods/events with human-readable names so the LLM
      // never sees product_id UUIDs. nutrients = approximate per-day totals as
      // an anchor (see requestDailyAnalysis / DAILY_SYSTEM_PROMPT).
      const [scheduleFoods, scheduleEvents, nutrientsByDay] = await Promise.all([
        collectFoods([date]),
        collectEvents([date]),
        collectNutrientsByDay([date]),
      ]);
      const nutrients = nutrientsByDay[0]?.nutrients ?? [];

      const controller = new AbortController();
      controllers.set(date, controller);

      set((s) => ({
        byDate: {
          ...s.byDate,
          [date]: {
            date,
            summary: '',
            observations: [],
            insights: [],
            hypotheses: [],
            appliedHypotheses,
            appliedUserMessage: userMessage || undefined,
            createdAt: new Date().toISOString(),
            status: 'loading',
            reason: null,
          },
        },
      }));
      persistNow();

      try {
        const result = await requestDailyAnalysis({
          date,
          scheduleFoods,
          scheduleEvents,
          nutrients,
          hypotheses: appliedHypotheses.map(({ title, body }) => ({
            title,
            body,
          })),
          userMessage,
          signal: controller.signal,
        });

        // An abort means interrupt() already owns the final state — leave it.
        if (controller.signal.aborted) return;

        patch(date, (a) => ({
          ...a,
          summary: result.summary,
          observations: result.observations,
          insights: result.insights,
          hypotheses: result.hypotheses,
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
        // Surface the failure as a toaster too. The store banner only shows
        // inside the analysis view; a paid AI run that failed after the user
        // navigated away would otherwise be a silent failure. «Повторить»
        // re-runs the same prompt (re-snapshots hypotheses + userMessage).
        const { message, action } = analysisFailureToast(reason, {
          onRetry: () => void get().start(date, { hypothesisIds, userMessage }),
        });
        toaster.error(message, { action });
      } finally {
        if (controllers.get(date) === controller) controllers.delete(date);
      }
    },

    interrupt: (date, reason) => {
      controllers.get(date)?.abort();
      controllers.delete(date);
      const cur = get().byDate[date];
      if (!cur || cur.status !== 'loading') return;
      patch(date, (a) => ({ ...a, status: 'interrupted', reason }));
      persistNow();
    },

    clear: (date) => {
      const cur = get().byDate[date];
      // Guard: clearing mid-request would let the resolution recreate the row.
      if (!cur || cur.status === 'loading') return;
      set((s) => {
        const next = { ...s.byDate };
        delete next[date];
        return { byDate: next };
      });
      persistNow();
    },
  };
});

// Coerce a record read from idb-keyval into the CURRENT DailyAnalysis shape.
// A record persisted by a pre-structured-output build carries {resultMd,
// ideaCards, status:'streaming'} and lacks summary/insights/hypotheses — those
// `undefined` arrays crash AnalysisResult (`insights.length`). Carry the old
// `resultMd` markdown over to `summary` so a cached разбор still shows; map the
// dead 'streaming' status to interrupted/reload (it can never resume).
function normalizeStored(raw: DailyAnalysis): DailyAnalysis {
  const r = raw as unknown as Record<string, unknown>;
  const wasStreaming = r.status === 'streaming';
  const summary =
    typeof r.summary === 'string'
      ? (r.summary as string)
      : typeof r.resultMd === 'string'
        ? (r.resultMd as string)
        : '';
  return {
    ...raw,
    summary,
    observations: Array.isArray(r.observations)
      ? (r.observations as DailyAnalysis['observations'])
      : [],
    insights: Array.isArray(r.insights)
      ? (r.insights as DailyAnalysis['insights'])
      : [],
    hypotheses: Array.isArray(r.hypotheses)
      ? (r.hypotheses as DailyAnalysis['hypotheses'])
      : [],
    status: wasStreaming ? 'interrupted' : raw.status,
    reason: wasStreaming ? 'reload' : (raw.reason ?? null),
  };
}

// Boot-time hydration. Reads idb-keyval, flips any request that was in flight
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
    // Coerce records written by an older app version (the streaming era:
    // {resultMd, ideaCards, status:'streaming'}, no summary/insights/hypotheses)
    // into the current shape — otherwise they crash AnalysisResult on `.length`.
    const normalized = normalizeStored(analysis);
    byDate[date] =
      normalized.status === 'loading'
        ? { ...normalized, status: 'interrupted', reason: 'reload' }
        : normalized;
  }

  // A request started before this idb read resolved already wrote a record
  // into the store. The stored snapshot is stale relative to it — let the
  // in-memory record win so a just-started request is not dropped on boot.
  const live = useDailyAnalysisStore.getState().byDate;
  for (const [date, analysis] of Object.entries(live)) {
    byDate[date] = analysis;
  }

  useDailyAnalysisStore.setState({ byDate, hydrated: true });
  void idbSet(STORAGE_KEY, byDate);
}
