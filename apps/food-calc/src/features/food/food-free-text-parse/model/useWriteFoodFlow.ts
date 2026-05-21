import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  parseFreeTextFood,
  type ParseResponse,
  type ResolvedItem,
  type AmbiguousItem,
  type UnresolvedItem,
  type MatchCandidate,
} from '../api/parseFreeTextFood';
import {
  clearParseState,
  readParseState,
  writeParseState,
  type PersistedParseState,
} from './parseStateStorage';
import { targetId, type ParseTarget } from './target';
import { db } from '@/shared/lib/dexie/schema';
import { addScheduleFood } from '@/entities/schedule-food/api/mutations';
import { addDishItem } from '@/entities/dish/api/mutations';
import { persistCustomTagsFromDetails } from '@/features/food/details-chips';
import { useUserId } from '@/shared/lib/auth/useUserId';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { useRecentlyAddedStore } from './recentlyAddedStore';
import {
  sendMatcherTelemetry,
  type TelemetryCorrection,
  type TelemetryEventPayload,
} from '../telemetry';

export type WriteFoodFlowState = 'idle' | 'loading' | 'ready' | 'error';

// Time + quantity редактятся inline на самом ряду (см. FreeTextFoodReviewItem) —
// модалка остаётся только для search (замена продукта через SearchFood) и
// details (заметка через DetailsChips).
export type ReviewEditStep = 'idle' | 'search' | 'details';

type ItemCategory = 'resolved' | 'ambiguous' | 'unresolved';

interface EditFlags {
  foodEdited: boolean;
  timeEdited: boolean;
  qtyEdited: boolean;
}

const EMPTY_FLAGS: EditFlags = { foodEdited: false, timeEdited: false, qtyEdited: false };

export type ResolvedRow = ResolvedItem & { uid: string; enabled: boolean } & EditFlags;
export type AmbiguousRow = AmbiguousItem & {
  uid: string;
  enabled: boolean;
  selectedId: string | null;
} & EditFlags;
export type UnresolvedRow = UnresolvedItem & {
  uid: string;
  manual: MatchCandidate | null;
} & EditFlags;

export interface ReviewRowView {
  uid: string;
  time: string;
  quantity: number;
  productId: string | null;
  productName: string;
  details: string;
  originalName: string;
}

export interface ReviewRowUpdates {
  time?: string;
  quantity?: number;
  productId?: string;
  name?: string;
  details?: string;
}

interface CommittedItem {
  productId: string;
  quantity: number;
  time: string;
  details: string;
}

interface DeletedItem {
  uid: string;
  type: ItemCategory;
  data: ResolvedRow | AmbiguousRow | UnresolvedRow;
}

const PARSE_TIMEOUT_MS = 35_000;
const STALE_LOADING_MS = 60_000;

export interface UseWriteFoodFlowResult {
  // Parse cycle
  state: WriteFoodFlowState;
  parseResult: ParseResponse | null;
  inputText: string;
  errorMessage: string | null;
  submit: (text: string) => void;
  retry: () => void;
  cancel: () => void;
  minimize: () => void;
  setInputText: (text: string) => void;

  // Review state
  resolved: ResolvedRow[];
  ambiguous: AmbiguousRow[];
  unresolved: UnresolvedRow[];
  hideTime: boolean;
  totalToAdd: number;
  isSubmitting: boolean;
  deletedItem: DeletedItem | null;

  // Edit state
  editingUid: string | null;
  editingStep: ReviewEditStep;
  editingRowView: ReviewRowView | null;

  // Review actions
  deleteResolved: (uid: string) => void;
  deleteAmbiguous: (uid: string) => void;
  deleteUnresolved: (uid: string) => void;
  updateResolved: (uid: string, updates: Partial<ResolvedRow>) => void;
  updateAmbiguous: (uid: string, updates: Partial<AmbiguousRow>) => void;
  updateUnresolved: (uid: string, updates: Partial<UnresolvedRow>) => void;
  handleUndo: () => void;
  startEdit: (uid: string, step: Exclude<ReviewEditStep, 'idle'>) => void;
  closeEdit: () => void;
  setEditingStep: (step: ReviewEditStep) => void;
  handleEditChange: (updates: ReviewRowUpdates) => void;
  commit: () => Promise<boolean>;
}

function makeRequestId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof (crypto as Crypto).randomUUID === 'function'
  ) {
    return (crypto as Crypto).randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const makeUid = () => Math.random().toString(36).slice(2, 10);

export function useWriteFoodFlow(target: ParseTarget): UseWriteFoodFlowResult {
  const userId = useUserId();
  const hideTime = target.kind === 'dish';

  const [state, setState] = useState<WriteFoodFlowState>('idle');
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resolved, setResolved] = useState<ResolvedRow[]>([]);
  const [ambiguous, setAmbiguous] = useState<AmbiguousRow[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletedItem, setDeletedItem] = useState<DeletedItem | null>(null);

  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<ReviewEditStep>('idle');

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const targetKeyRef = useRef<string>(`${target.kind}:${targetId(target)}`);

  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const matcherLatencyRef = useRef<number>(0);
  const reviewStartRef = useRef<number>(0);
  const deletedCountRef = useRef<number>(0);
  const telemetrySentRef = useRef<boolean>(false);
  const originalChoicesRef = useRef<
    Map<string, { originalName: string; matcherChoice: string }>
  >(new Map());
  const lastAppliedParseResultRef = useRef<ParseResponse | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const abortActive = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearTimer();
  }, [clearTimer]);

  const resetTelemetryForNewResponse = useCallback((response: ParseResponse) => {
    requestIdRef.current = response.requestId;
    matcherLatencyRef.current = 0;
    reviewStartRef.current = Date.now();
    deletedCountRef.current = 0;
    telemetrySentRef.current = false;
  }, []);

  const applyResponse = useCallback(
    (response: ParseResponse) => {
      resetTelemetryForNewResponse(response);
      const choices = originalChoicesRef.current;
      choices.clear();

      const resolvedRows: ResolvedRow[] = response.resolved.map((r) => {
        const uid = makeUid();
        choices.set(uid, { originalName: r.originalName, matcherChoice: r.productId });
        return { ...r, uid, enabled: true, ...EMPTY_FLAGS };
      });
      const ambiguousRows: AmbiguousRow[] = response.ambiguous.map((a) => {
        const uid = makeUid();
        const initialId = a.candidates[0]?.id ?? '';
        choices.set(uid, { originalName: a.originalName, matcherChoice: initialId });
        return {
          ...a,
          uid,
          enabled: true,
          selectedId: a.candidates[0]?.id ?? null,
          ...EMPTY_FLAGS,
        };
      });
      const unresolvedRows: UnresolvedRow[] = response.unresolved.map((u) => {
        const uid = makeUid();
        choices.set(uid, { originalName: u.originalName, matcherChoice: '' });
        return { ...u, uid, manual: null, ...EMPTY_FLAGS };
      });

      setResolved(resolvedRows);
      setAmbiguous(ambiguousRows);
      setUnresolved(unresolvedRows);
    },
    [resetTelemetryForNewResponse],
  );

  const startFetch = useCallback(
    (text: string, requestId: string, startedAt: number) => {
      const controller = new AbortController();
      abortRef.current = controller;
      activeRequestIdRef.current = requestId;

      clearTimer();
      timeoutRef.current = setTimeout(() => {
        if (activeRequestIdRef.current !== requestId) return;
        controller.abort();
        const persisted: PersistedParseState = {
          target,
          status: 'error',
          inputText: text,
          errorMessage: 'Не дождались ответа. Попробуйте ещё раз.',
          startedAt,
          requestId,
        };
        writeParseState(persisted);
        setState('error');
        setErrorMessage(persisted.errorMessage ?? null);
      }, PARSE_TIMEOUT_MS);

      parseFreeTextFood(text, controller.signal).then(
        (response) => {
          if (controller.signal.aborted) return;
          if (activeRequestIdRef.current !== requestId) return;
          clearTimer();
          const persisted: PersistedParseState = {
            target,
            status: 'ready',
            inputText: text,
            parseResult: response,
            startedAt,
            requestId,
          };
          writeParseState(persisted);
          setParseResult(response);
          setErrorMessage(null);
          setState('ready');
        },
        (err: unknown) => {
          if (controller.signal.aborted) return;
          if (activeRequestIdRef.current !== requestId) return;
          clearTimer();
          const message =
            err instanceof Error ? err.message : 'Не удалось разобрать текст';
          const persisted: PersistedParseState = {
            target,
            status: 'error',
            inputText: text,
            errorMessage: message,
            startedAt,
            requestId,
          };
          writeParseState(persisted);
          setErrorMessage(message);
          setState('error');
        },
      );
    },
    [clearTimer, target],
  );

  // Restore state from storage when target changes.
  useEffect(() => {
    const nextKey = `${target.kind}:${targetId(target)}`;

    // Target actually changed vs. a ref identity change — reset local state.
    if (targetKeyRef.current !== nextKey) {
      abortActive();
      activeRequestIdRef.current = null;
      targetKeyRef.current = nextKey;
    }

    const persisted = readParseState(target);
    if (!persisted) {
      setState('idle');
      setParseResult(null);
      setInputText('');
      setErrorMessage(null);
      return;
    }

    setInputText(persisted.inputText);

    if (persisted.status === 'ready' && persisted.parseResult) {
      setParseResult(persisted.parseResult);
      setErrorMessage(null);
      setState('ready');
      return;
    }

    if (persisted.status === 'error') {
      setParseResult(null);
      setErrorMessage(persisted.errorMessage ?? 'Не удалось разобрать текст');
      setState('error');
      return;
    }

    // loading
    const age = Date.now() - persisted.startedAt;
    if (age >= STALE_LOADING_MS) {
      const updated: PersistedParseState = {
        ...persisted,
        status: 'error',
        errorMessage: 'Не дождались ответа. Попробуйте ещё раз.',
      };
      writeParseState(updated);
      setParseResult(null);
      setErrorMessage(updated.errorMessage ?? null);
      setState('error');
      return;
    }

    // Within grace window — re-submit with new requestId, keep same inputText.
    setParseResult(null);
    setErrorMessage(null);
    setState('loading');
    const newRequestId = makeRequestId();
    const refreshed: PersistedParseState = {
      ...persisted,
      requestId: newRequestId,
      startedAt: Date.now(),
    };
    writeParseState(refreshed);
    startFetch(persisted.inputText, newRequestId, refreshed.startedAt);
    // cleanup on unmount handled by separate effect
  }, [target.kind, targetId(target)]);

  // Hydrate review rows whenever parseResult lands.
  useEffect(() => {
    if (parseResult && parseResult !== lastAppliedParseResultRef.current) {
      lastAppliedParseResultRef.current = parseResult;
      applyResponse(parseResult);
      return;
    }
    if (!parseResult && lastAppliedParseResultRef.current !== null) {
      lastAppliedParseResultRef.current = null;
      setResolved([]);
      setAmbiguous([]);
      setUnresolved([]);
    }
  }, [parseResult, applyResponse]);

  // ─── Telemetry helpers ───

  const buildTelemetry = useCallback(
    (
      action: 'commit' | 'abandon',
      committedRows: {
        resolved: ResolvedRow[];
        ambiguous: AmbiguousRow[];
        unresolved: UnresolvedRow[];
      },
    ): TelemetryEventPayload | null => {
      if (!requestIdRef.current) return null;

      const choices = originalChoicesRef.current;
      const corrections: TelemetryCorrection[] = [];
      let itemsCommitted = 0;
      let foodEdited = 0;
      let timeEdited = 0;
      let qtyEdited = 0;

      for (const r of committedRows.resolved) {
        if (r.foodEdited) foodEdited += 1;
        if (r.timeEdited) timeEdited += 1;
        if (r.qtyEdited) qtyEdited += 1;
        if (!r.enabled) continue;
        itemsCommitted += 1;
        const original = choices.get(r.uid);
        if (!original) continue;
        corrections.push({
          originalName: original.originalName,
          matcherChoice: original.matcherChoice,
          userChoice: r.productId,
          correctionType:
            r.productId === original.matcherChoice ? 'accepted-top1' : 'manual-search',
        });
      }

      for (const a of committedRows.ambiguous) {
        if (a.foodEdited) foodEdited += 1;
        if (a.timeEdited) timeEdited += 1;
        if (a.qtyEdited) qtyEdited += 1;
        if (!a.enabled || !a.selectedId) continue;
        itemsCommitted += 1;
        const original = choices.get(a.uid);
        if (!original) continue;
        corrections.push({
          originalName: original.originalName,
          matcherChoice: original.matcherChoice,
          userChoice: a.selectedId,
          correctionType:
            a.selectedId === original.matcherChoice
              ? 'accepted-top1'
              : 'switched-ambiguous',
        });
      }

      for (const u of committedRows.unresolved) {
        if (u.foodEdited) foodEdited += 1;
        if (u.timeEdited) timeEdited += 1;
        if (u.qtyEdited) qtyEdited += 1;
        if (!u.manual) continue;
        itemsCommitted += 1;
        const original = choices.get(u.uid);
        if (!original) continue;
        corrections.push({
          originalName: original.originalName,
          matcherChoice: '',
          userChoice: u.manual.id,
          correctionType: 'manual-search',
        });
      }

      const itemsTotal =
        committedRows.resolved.length +
        committedRows.ambiguous.length +
        committedRows.unresolved.length +
        deletedCountRef.current;

      return {
        requestId: requestIdRef.current,
        userId: userId ?? '',
        action,
        itemsTotal,
        itemsCommitted,
        itemsDeleted: deletedCountRef.current,
        itemsWithEditedFood: foodEdited,
        itemsWithEditedTime: timeEdited,
        itemsWithEditedQty: qtyEdited,
        corrections,
        llmLatencyMs: 0,
        matcherLatencyMs: matcherLatencyRef.current,
        reviewDurationMs: reviewStartRef.current
          ? Date.now() - reviewStartRef.current
          : 0,
      };
    },
    [userId],
  );

  const sendTelemetryIfNotSent = useCallback(
    (action: 'commit' | 'abandon') => {
      if (telemetrySentRef.current) return;
      const snapshot = buildTelemetry(action, { resolved, ambiguous, unresolved });
      if (!snapshot) return;
      telemetrySentRef.current = true;
      sendMatcherTelemetry(snapshot);
    },
    [buildTelemetry, resolved, ambiguous, unresolved],
  );

  const sendTelemetryRef = useRef(sendTelemetryIfNotSent);
  useEffect(() => {
    sendTelemetryRef.current = sendTelemetryIfNotSent;
  }, [sendTelemetryIfNotSent]);

  // Unmount cleanup — abort in-flight fetch, clear timers, fire `abandon`.
  useEffect(() => {
    return () => {
      abortActive();
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      sendTelemetryRef.current('abandon');
    };
  }, []);

  // ─── Parse-cycle actions ───

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      abortActive();
      const requestId = makeRequestId();
      const startedAt = Date.now();
      const persisted: PersistedParseState = {
        target,
        status: 'loading',
        inputText: trimmed,
        startedAt,
        requestId,
      };
      writeParseState(persisted);
      setInputText(trimmed);
      setParseResult(null);
      setErrorMessage(null);
      setState('loading');
      startFetch(trimmed, requestId, startedAt);
    },
    [abortActive, startFetch, target],
  );

  const retry = useCallback(() => {
    if (!inputText.trim()) {
      setState('idle');
      return;
    }
    submit(inputText);
  }, [inputText, submit]);

  const resetAll = useCallback(() => {
    setState('idle');
    setParseResult(null);
    setInputText('');
    setErrorMessage(null);
    setResolved([]);
    setAmbiguous([]);
    setUnresolved([]);
    setDeletedItem(null);
    setEditingUid(null);
    setEditingStep('idle');
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    lastAppliedParseResultRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    abortActive();
    activeRequestIdRef.current = null;
    clearParseState(target);
    resetAll();
  }, [abortActive, target, resetAll]);

  const minimize = useCallback(() => {
    // No-op on state/storage — modal close is the caller's responsibility.
    // Fetch keeps going.
  }, []);

  // ─── Review: delete + undo ───

  const scheduleUndoExpiry = useCallback(() => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setDeletedItem(null), 3000);
  }, []);

  const enqueueDelete = useCallback(
    (uid: string, type: ItemCategory, data: DeletedItem['data']) => {
      setDeletedItem({ uid, type, data });
      deletedCountRef.current += 1;
      scheduleUndoExpiry();
    },
    [scheduleUndoExpiry],
  );

  const deleteResolved = useCallback(
    (uid: string) => {
      setResolved((prev) => {
        const item = prev.find((r) => r.uid === uid);
        if (item) enqueueDelete(uid, 'resolved', item);
        return prev.filter((r) => r.uid !== uid);
      });
    },
    [enqueueDelete],
  );

  const deleteAmbiguous = useCallback(
    (uid: string) => {
      setAmbiguous((prev) => {
        const item = prev.find((a) => a.uid === uid);
        if (item) enqueueDelete(uid, 'ambiguous', item);
        return prev.filter((a) => a.uid !== uid);
      });
    },
    [enqueueDelete],
  );

  const deleteUnresolved = useCallback(
    (uid: string) => {
      setUnresolved((prev) => {
        const item = prev.find((u) => u.uid === uid);
        if (item) enqueueDelete(uid, 'unresolved', item);
        return prev.filter((u) => u.uid !== uid);
      });
    },
    [enqueueDelete],
  );

  const handleUndo = useCallback(() => {
    if (!deletedItem) return;
    if (deletedItem.type === 'resolved')
      setResolved((prev) => [...prev, deletedItem.data as ResolvedRow]);
    else if (deletedItem.type === 'ambiguous')
      setAmbiguous((prev) => [...prev, deletedItem.data as AmbiguousRow]);
    else setUnresolved((prev) => [...prev, deletedItem.data as UnresolvedRow]);
    deletedCountRef.current = Math.max(0, deletedCountRef.current - 1);
    setDeletedItem(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  }, [deletedItem]);

  // ─── Review: row updates ───

  const editFlagsFromUpdates = useCallback(
    (updates: Record<string, unknown>): Partial<EditFlags> => {
      const flags: Partial<EditFlags> = {};
      if ('time' in updates) flags.timeEdited = true;
      if ('quantity' in updates) flags.qtyEdited = true;
      if (
        'productId' in updates ||
        'selectedId' in updates ||
        'manual' in updates ||
        'name' in updates
      ) {
        flags.foodEdited = true;
      }
      return flags;
    },
    [],
  );

  const updateResolved = useCallback(
    (uid: string, updates: Partial<ResolvedRow>) => {
      const flags = editFlagsFromUpdates(updates as Record<string, unknown>);
      setResolved((prev) =>
        prev.map((r) => (r.uid === uid ? { ...r, ...updates, ...flags } : r)),
      );
    },
    [editFlagsFromUpdates],
  );

  const updateAmbiguous = useCallback(
    (uid: string, updates: Partial<AmbiguousRow>) => {
      const flags = editFlagsFromUpdates(updates as Record<string, unknown>);
      setAmbiguous((prev) =>
        prev.map((a) => (a.uid === uid ? { ...a, ...updates, ...flags } : a)),
      );
    },
    [editFlagsFromUpdates],
  );

  const updateUnresolved = useCallback(
    (uid: string, updates: Partial<UnresolvedRow>) => {
      const flags = editFlagsFromUpdates(updates as Record<string, unknown>);
      setUnresolved((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, ...updates, ...flags } : u)),
      );
    },
    [editFlagsFromUpdates],
  );

  // ─── Review: edit orchestration ───

  const findCategory = useCallback(
    (uid: string): ItemCategory | null => {
      if (resolved.some((r) => r.uid === uid)) return 'resolved';
      if (ambiguous.some((a) => a.uid === uid)) return 'ambiguous';
      if (unresolved.some((u) => u.uid === uid)) return 'unresolved';
      return null;
    },
    [resolved, ambiguous, unresolved],
  );

  const startEdit = useCallback((uid: string, step: Exclude<ReviewEditStep, 'idle'>) => {
    setEditingUid(uid);
    setEditingStep(step);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingUid(null);
    setEditingStep('idle');
  }, []);

  const editingRowView = useMemo<ReviewRowView | null>(() => {
    if (!editingUid) return null;
    const r = resolved.find((row) => row.uid === editingUid);
    if (r) {
      return {
        uid: r.uid,
        time: r.time,
        quantity: r.quantity,
        productId: r.productId,
        productName: r.name,
        details: r.details,
        originalName: r.originalName,
      };
    }
    const a = ambiguous.find((row) => row.uid === editingUid);
    if (a) {
      const sel = a.candidates.find((c) => c.id === a.selectedId) ?? a.candidates[0];
      return {
        uid: a.uid,
        time: a.time,
        quantity: a.quantity,
        productId: a.selectedId,
        productName: sel?.name ?? '',
        details: a.details,
        originalName: a.originalName,
      };
    }
    const u = unresolved.find((row) => row.uid === editingUid);
    if (u) {
      return {
        uid: u.uid,
        time: u.time,
        quantity: u.quantity,
        productId: u.manual?.id ?? null,
        productName: u.manual?.name ?? '',
        details: u.details,
        originalName: u.originalName,
      };
    }
    return null;
  }, [editingUid, resolved, ambiguous, unresolved]);

  const handleEditChange = useCallback(
    (updates: ReviewRowUpdates) => {
      if (!editingUid) return;
      const cat = findCategory(editingUid);
      if (!cat) return;
      if (cat === 'resolved') {
        const u: Partial<ResolvedRow> = {};
        if (updates.time !== undefined) u.time = updates.time;
        if (updates.quantity !== undefined) u.quantity = updates.quantity;
        if (updates.productId !== undefined) u.productId = updates.productId;
        if (updates.name !== undefined) u.name = updates.name;
        if (updates.details !== undefined) u.details = updates.details;
        updateResolved(editingUid, u);
      } else if (cat === 'ambiguous') {
        const u: Partial<AmbiguousRow> = {};
        if (updates.time !== undefined) u.time = updates.time;
        if (updates.quantity !== undefined) u.quantity = updates.quantity;
        if (updates.productId !== undefined) u.selectedId = updates.productId;
        if (updates.details !== undefined) u.details = updates.details;
        updateAmbiguous(editingUid, u);
      } else {
        const u: Partial<UnresolvedRow> = {};
        if (updates.time !== undefined) u.time = updates.time;
        if (updates.quantity !== undefined) u.quantity = updates.quantity;
        if (updates.productId !== undefined) {
          u.manual = {
            id: updates.productId,
            name: updates.name ?? '',
            score: 1,
          };
        }
        if (updates.details !== undefined) u.details = updates.details;
        updateUnresolved(editingUid, u);
      }
    },
    [editingUid, findCategory, updateResolved, updateAmbiguous, updateUnresolved],
  );

  // ─── Review: commit ───

  const totalToAdd = useMemo(() => {
    const a = resolved.filter((r) => r.enabled).length;
    const b = ambiguous.filter((x) => x.enabled && x.selectedId).length;
    const c = unresolved.filter((u) => u.manual).length;
    return a + b + c;
  }, [resolved, ambiguous, unresolved]);

  const commit = useCallback(async (): Promise<boolean> => {
    if (isSubmitting || totalToAdd === 0) return false;
    setIsSubmitting(true);
    try {
      const committed: CommittedItem[] = [];

      for (const r of resolved) {
        if (!r.enabled) continue;
        committed.push({
          productId: r.productId,
          quantity: r.quantity,
          time: r.time,
          details: r.details,
        });
      }

      for (const a of ambiguous) {
        if (!a.enabled || !a.selectedId) continue;
        committed.push({
          productId: a.selectedId,
          quantity: a.quantity,
          time: a.time,
          details: a.details,
        });
      }

      for (const u of unresolved) {
        if (!u.manual || !u.manual.id) continue;
        committed.push({
          productId: u.manual.id,
          quantity: u.quantity,
          time: u.time,
          details: u.details,
        });
      }

      if (committed.length === 0) {
        setIsSubmitting(false);
        return false;
      }

      if (!userId) {
        toaster.error('Не авторизованы');
        setIsSubmitting(false);
        return false;
      }

      let ok = true;
      const newScheduleIds: string[] = [];
      if (target.kind === 'schedule') {
        const date = target.date;
        const result = await safeMutate(
          () =>
            db.transaction('rw', db.schedule_foods, async () => {
              for (const c of committed) {
                const id = await addScheduleFood({
                  date,
                  time: c.time,
                  type: 'food',
                  quantity: c.quantity,
                  productId: c.productId,
                  details: c.details ?? '',
                });
                newScheduleIds.push(id);
              }
            }),
          'Не удалось добавить продукты',
        );
        ok = result.ok;
      } else {
        const dishId = target.dishId;
        const result = await safeMutate(
          () =>
            db.transaction('rw', db.dish_items, async () => {
              for (const c of committed) {
                await addDishItem({
                  dishId,
                  productId: c.productId,
                  quantity: c.quantity,
                });
              }
            }),
          'Не удалось добавить продукты в блюдо',
        );
        ok = result.ok;
      }

      if (!ok) {
        setIsSubmitting(false);
        return false;
      }

      // Fire-and-forget: stash any free-form details the user (or the LLM)
      // attached as custom_tags so they show up as chips next time.
      if (target.kind === 'schedule') {
        for (const c of committed) {
          void persistCustomTagsFromDetails(c.productId, c.details);
        }
      }
      sendTelemetryIfNotSent('commit');
      toaster.success(`Добавлено: ${committed.length}`);

      if (target.kind === 'schedule' && newScheduleIds.length > 0) {
        useRecentlyAddedStore.getState().addMany(newScheduleIds);
      }

      clearParseState(target);
      resetAll();
      setIsSubmitting(false);
      return true;
    } catch (e) {
      setIsSubmitting(false);
      const message = e instanceof Error ? e.message : 'Не удалось добавить продукты';
      toaster.error(message);
      return false;
    }
  }, [
    isSubmitting,
    totalToAdd,
    resolved,
    ambiguous,
    unresolved,
    target,
    userId,
    sendTelemetryIfNotSent,
    resetAll,
  ]);

  return {
    state,
    parseResult,
    inputText,
    errorMessage,
    submit,
    retry,
    cancel,
    minimize,
    setInputText,

    resolved,
    ambiguous,
    unresolved,
    hideTime,
    totalToAdd,
    isSubmitting,
    deletedItem,

    editingUid,
    editingStep,
    editingRowView,

    deleteResolved,
    deleteAmbiguous,
    deleteUnresolved,
    updateResolved,
    updateAmbiguous,
    updateUnresolved,
    handleUndo,
    startEdit,
    closeEdit,
    setEditingStep,
    handleEditChange,
    commit,
  };
}
