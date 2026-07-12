import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  parseFreeTextFood,
  type ParseResponse,
  type ResolvedItem,
  type AmbiguousItem,
  type UnresolvedItem,
  type MatchCandidate,
} from '../api/parseFreeTextFood';
import { parseDishName } from '../api/parseDishName';
import {
  clearParseState,
  readParseState,
  writeParseState,
  type PersistedParseState,
  type ParseIntake,
} from './parseStateStorage';
import { targetId, type ParseTarget } from './target';
import { matchLocalProduct, type LocalMatchCandidate } from './localMatch';
import { db } from '@/shared/lib/dexie/schema';
import { addScheduleFood } from '@/entities/schedule-food/api/mutations';
import { addDishItem } from '@/entities/dish/api/mutations';
import { useProducts } from '@/entities/product';
import { isCatalogId } from '@/shared/data/catalog';
import { persistCustomTagsFromDetails } from '@/features/food/details-chips';
import { useUserId } from '@/shared/lib/auth/useUserId';
import toaster from '@/shared/lib/toaster/toaster';
import { classifyError, defaultUserMessage } from '@/shared/lib/errors/classify';
import { safeMutate } from '@/shared/lib/safeMutate';
import { scrollToNewRow } from '@/features/food/food-entry-flow/scrollToNewRow';
import { markAdded } from '@/shared/model/recentlyAddedStore';
import { useHaptic } from '@/shared/lib/hooks/useHaptic';
import { countDismissed, countTotal, selectCommittable } from './selectCommittable';
import {
  sendMatcherTelemetry,
  type TelemetryCorrection,
  type TelemetryEventPayload,
} from '../telemetry';

export type WriteFoodFlowState = 'idle' | 'loading' | 'ready' | 'error';

// Time + quantity редактятся inline на самом ряду (см. ProposalFoodItem) —
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
  enabled: boolean;
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

const PARSE_TIMEOUT_MS = 35_000;
const STALE_LOADING_MS = 60_000;

export interface UseWriteFoodFlowResult {
  /** Куда коммитим — 'schedule' | 'dish'. Консумеры (InlineWriteFoodReview)
   *  читают, чтобы прятать БАД из rescue-поиска в блюде (basis-gap, 2026-06-20). */
  targetKind: ParseTarget['kind'];
  // Parse cycle
  state: WriteFoodFlowState;
  parseResult: ParseResponse | null;
  inputText: string;
  errorMessage: string | null;
  submit: (text: string) => void;
  submitDishName: (dishName: string, comment?: string) => void;
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

  // Edit state
  editingUid: string | null;
  editingStep: ReviewEditStep;
  editingRowView: ReviewRowView | null;

  // Review actions — soft-delete: `toggle*` инвертит `enabled`. Ряд остаётся
  // в массиве, `commit` + `totalToAdd` игнорируют `enabled === false`. Раньше
  // тут параллельно жил hard-delete (`delete*` + `handleUndo` + toast), его
  // выпилили после миграции DishBuilder 2026-05-23 — единый паттерн с
  // InlineWriteFoodReview (Todoist/Things канон).
  toggleResolved: (uid: string) => void;
  toggleAmbiguous: (uid: string) => void;
  toggleUnresolved: (uid: string) => void;
  updateResolved: (uid: string, updates: Partial<ResolvedRow>) => void;
  updateAmbiguous: (uid: string, updates: Partial<AmbiguousRow>) => void;
  updateUnresolved: (uid: string, updates: Partial<UnresolvedRow>) => void;
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
  const haptic = useHaptic();
  const hideTime = target.kind === 'dish';

  // User's OWN products for the client-side local match (the backend matches
  // only the system catalog and never sees these — см. localMatch.ts). Exclude
  // catalog rows (already matched server-side) and, when building a dish,
  // serving-basis supplements (per-100g dish math can't use them — same rule as
  // SearchFood's ingredient mode).
  const allProducts = useProducts();
  const localMatchCandidates = useMemo<LocalMatchCandidate[]>(() => {
    const userOnly = allProducts.filter((p) => !isCatalogId(p.id));
    const base =
      target.kind === 'dish'
        ? userOnly.filter((p) => p.servingBasis !== 'serving')
        : userOnly;
    return base.map((p) => ({ id: p.id, name: p.name }));
  }, [allProducts, target.kind]);
  // applyResponse reads candidates via a ref so it needn't list them as a dep
  // (which would churn its identity on every Dexie live-query tick).
  const localMatchCandidatesRef = useRef<LocalMatchCandidate[]>([]);
  useEffect(() => {
    localMatchCandidatesRef.current = localMatchCandidates;
  }, [localMatchCandidates]);

  const [state, setState] = useState<WriteFoodFlowState>('idle');
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
  const [inputText, setInputText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resolved, setResolved] = useState<ResolvedRow[]>([]);
  const [ambiguous, setAmbiguous] = useState<AmbiguousRow[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<ReviewEditStep>('idle');

  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  const targetKeyRef = useRef<string>(`${target.kind}:${targetId(target)}`);
  // Which front-end produced the latest intake — so `retry` re-runs the right
  // one (text → head B, dishName → head A) instead of always re-parsing as text.
  const lastIntakeRef = useRef<ParseIntake>('text');
  // The «Уточнения» comment of the latest dishName intake — re-applied on retry.
  const lastCommentRef = useRef<string | undefined>(undefined);

  const requestIdRef = useRef<string | null>(null);
  const matcherLatencyRef = useRef<number>(0);
  const reviewStartRef = useRef<number>(0);
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
      const cands = localMatchCandidatesRef.current;
      const unresolvedRows: UnresolvedRow[] = response.unresolved.map((u) => {
        const uid = makeUid();
        choices.set(uid, { originalName: u.originalName, matcherChoice: '' });
        // Local match against the user's OWN products — the ones the server-side
        // catalog matcher can't see. A hit pre-fills `manual`, so the row renders
        // like a manual rescue and rides the existing commit path (productId).
        const local = cands.length > 0 ? matchLocalProduct(u.originalName, cands) : null;
        return { ...u, uid, manual: local, enabled: true, ...EMPTY_FLAGS };
      });

      setResolved(resolvedRows);
      setAmbiguous(ambiguousRows);
      setUnresolved(unresolvedRows);
    },
    [resetTelemetryForNewResponse],
  );

  const startFetch = useCallback(
    (
      text: string,
      requestId: string,
      startedAt: number,
      intake: ParseIntake = 'text',
      comment?: string,
    ) => {
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
          intake,
          comment,
        };
        writeParseState(persisted);
        setState('error');
        setErrorMessage(persisted.errorMessage ?? null);
        // Единственный видимый фидбэк об ошибке — toaster (красную рамку убрали).
        // kind: 'timeout' → короткая длительность тоста (3s, см. toaster.ts).
        toaster.error('Не дождались ответа. Попробуйте ещё раз.', {
          kind: { kind: 'timeout', message: 'parse timeout', raw: null },
        });
      }, PARSE_TIMEOUT_MS);

      // Two front-ends, one state machine: typed text → head B; semantic
      // "infer recipe" button → head A. Both resolve to the same ParseResponse.
      // Only head A carries the optional «Уточнения» comment.
      const parsePromise =
        intake === 'dishName'
          ? parseDishName(text, requestId, comment, controller.signal)
          : parseFreeTextFood(text, requestId, controller.signal);
      parsePromise.then(
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
            intake,
            comment,
          };
          writeParseState(persisted);
          setParseResult(response);
          setErrorMessage(null);
          // Очищаем input в момент успешного разбора — текст уже виден в
          // `.originalText` блока предложки. Поле освобождается под следующий
          // ввод. На restore-grace (страница перезагружена во время разбора)
          // в персисте `inputText` остаётся — юзер увидит его в баре, и при
          // resolve мы тоже очистим, что ОК (результат у юзера уже на
          // экране, дублировать в input не нужно).
          setInputText('');
          setState('ready');
        },
        (err: unknown) => {
          if (controller.signal.aborted) return;
          if (activeRequestIdRef.current !== requestId) return;
          clearTimer();
          // Классифицируем (network/timeout/402/server/...) → человекочитаемый
          // RU-текст. Это же сообщение показываем тостером — единственный фидбэк
          // об ошибке после того, как красную рамку с пилюли убрали. Заодно
          // покрывает 402 «Недостаточно средств», которое раньше молча краснело.
          const kind = classifyError(err);
          const message = defaultUserMessage(kind);
          const persisted: PersistedParseState = {
            target,
            status: 'error',
            inputText: text,
            errorMessage: message,
            startedAt,
            requestId,
            intake,
            comment,
          };
          writeParseState(persisted);
          setErrorMessage(message);
          setState('error');
          toaster.error(message, { kind });
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

    // Within grace window — re-submit REUSING persisted.requestId (fix #4). The
    // original request may have reached the server and charged; a fresh id would
    // slip past the X-Request-Id idempotency and debit a second time. Reusing it
    // makes the resubmit a no-op charge server-side. Only the timeout clock
    // (startedAt) is refreshed.
    setParseResult(null);
    setErrorMessage(null);
    setState('loading');
    const refreshed: PersistedParseState = {
      ...persisted,
      startedAt: Date.now(),
    };
    writeParseState(refreshed);
    startFetch(
      persisted.inputText,
      persisted.requestId,
      refreshed.startedAt,
      persisted.intake,
      persisted.comment,
    );
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

  // Late-load catch-up for the local user-product match. applyResponse fills
  // `manual` on a fresh parse, but on a cold restore the persisted parseResult
  // can hydrate before the Dexie products live-query resolves, and the user may
  // create (or delete) a product while the review is open. Re-run the match
  // whenever the candidate set changes. Functional update + changed-guard → no
  // dep on `unresolved`, no render loop.
  useEffect(() => {
    if (localMatchCandidates.length === 0) return;
    const candidateIds = new Set(localMatchCandidates.map((c) => c.id));
    setUnresolved((prev) => {
      let changed = false;
      const next = prev.map((u) => {
        // Never touch a row the user hand-picked (`foodEdited`) or dismissed
        // (`enabled === false` — it can't commit, so a fill/re-check is moot and
        // would only flash a product onto a struck-through row).
        if (u.foodEdited || !u.enabled) return u;
        // An auto-matched row is kept only while its product still exists. A
        // product deleted elsewhere while the review is open would otherwise
        // ride into commit as an orphan `productId` — re-match (or clear).
        if (u.manual) {
          if (candidateIds.has(u.manual.id)) return u;
          changed = true;
          return { ...u, manual: matchLocalProduct(u.originalName, localMatchCandidates) };
        }
        const local = matchLocalProduct(u.originalName, localMatchCandidates);
        if (!local) return u;
        changed = true;
        return { ...u, manual: local };
      });
      return changed ? next : prev;
    });
  }, [localMatchCandidates]);

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
        if (!u.enabled || !u.manual) continue;
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

      // itemsDeleted/itemsTotal — pure-функции из `selectCommittable.ts`,
      // чтобы unit-тесты валидировали тот же источник, который читает
      // прод. Раньше inline-копия логики жила в нескольких местах
      // (test-mirror антипаттерн).
      const itemsDeleted = countDismissed(committedRows);
      const itemsTotal = countTotal(committedRows);

      return {
        requestId: requestIdRef.current,
        userId: userId ?? '',
        action,
        itemsTotal,
        itemsCommitted,
        itemsDeleted,
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

  // Unmount cleanup — abort in-flight fetch, fire `abandon`.
  useEffect(() => {
    return () => {
      abortActive();
      sendTelemetryRef.current('abandon');
    };
  }, []);

  const startIntake = useCallback(
    (
      rawText: string,
      intake: ParseIntake,
      comment?: string,
      // When re-issuing the SAME logical parse (a manual retry), the caller
      // passes the failed attempt's requestId so the server dedups the charge
      // instead of debiting again. A brand-new intake mints a fresh id.
      reuseRequestId?: string,
    ) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;
      lastIntakeRef.current = intake;
      lastCommentRef.current = comment;
      abortActive();
      const requestId = reuseRequestId ?? makeRequestId();
      const startedAt = Date.now();
      const persisted: PersistedParseState = {
        target,
        status: 'loading',
        inputText: trimmed,
        startedAt,
        requestId,
        intake,
        comment,
      };
      writeParseState(persisted);
      setInputText(trimmed);
      setParseResult(null);
      setErrorMessage(null);
      setState('loading');
      startFetch(trimmed, requestId, startedAt, intake, comment);
    },
    [abortActive, startFetch, target],
  );

  // Typed text (head B). Same single entry point the bottom write-bar uses.
  const submit = useCallback((text: string) => startIntake(text, 'text'), [startIntake]);

  // Semantic "infer recipe" button (head A) — symmetric to `submit`: fetch lives
  // inside the engine, result lands in the same resolved/ambiguous/unresolved
  // state machine + предложка. Used by the dish page «Предложить ингредиенты»
  // button; `comment` is the optional «Уточнения» clarification.
  const submitDishName = useCallback(
    (dishName: string, comment?: string) => startIntake(dishName, 'dishName', comment),
    [startIntake],
  );

  const retry = useCallback(() => {
    if (!inputText.trim()) {
      setState('idle');
      return;
    }
    // Reuse the failed attempt's requestId (fix #5): a manual retry of the same
    // input must not mint a fresh X-Request-Id, or a request that already
    // charged server-side (response lost) would be debited a second time.
    // BUT only when the text is UNCHANGED (persisted inputText is trimmed, so
    // compare against the trimmed current text). Edited text is a different
    // logical request — reusing the id there would dedup the charge to zero and
    // parse the new text for free; mint a fresh id instead.
    const prev = readParseState(target);
    const reuseRequestId =
      prev && prev.inputText === inputText.trim() ? prev.requestId : undefined;
    startIntake(inputText, lastIntakeRef.current, lastCommentRef.current, reuseRequestId);
  }, [inputText, startIntake, target]);

  const resetAll = useCallback(() => {
    setState('idle');
    setParseResult(null);
    setInputText('');
    setErrorMessage(null);
    setResolved([]);
    setAmbiguous([]);
    setUnresolved([]);
    setEditingUid(null);
    setEditingStep('idle');
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

  //
  // `toggle*` инвертит `enabled` на ряду; ряд остаётся в массиве, `commit` +
  // `totalToAdd` (`selectCommittable`) игнорируют `enabled === false`. UI
  // рисует strikethrough + ↶ на месте крестика. Никакого 3-секундного
  // toast'а / auto-cancel'а / hard-delete'а — единственный путь dismiss'а для
  // обеих точек входа, обе теперь на InlineWriteFoodReview (HomePage/Schedule +
  // DishBuilderPage, последний подмонтирован 2026-06-05).
  const toggleResolved = useCallback((uid: string) => {
    setResolved((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, enabled: !r.enabled } : r)),
    );
  }, []);

  const toggleAmbiguous = useCallback((uid: string) => {
    setAmbiguous((prev) =>
      prev.map((a) => (a.uid === uid ? { ...a, enabled: !a.enabled } : a)),
    );
  }, []);

  const toggleUnresolved = useCallback((uid: string) => {
    setUnresolved((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, enabled: !u.enabled } : u)),
    );
  }, []);

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

  const totalToAdd = useMemo(() => {
    const a = resolved.filter((r) => r.enabled).length;
    const b = ambiguous.filter((x) => x.enabled && x.selectedId).length;
    const c = unresolved.filter((u) => u.enabled && u.manual).length;
    return a + b + c;
  }, [resolved, ambiguous, unresolved]);

  const commit = useCallback(async (): Promise<boolean> => {
    if (isSubmitting || totalToAdd === 0) return false;
    setIsSubmitting(true);
    try {
      const committed = selectCommittable({ resolved, ambiguous, unresolved });

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
      // Генерим id рядов ЗАРАНЕЕ и помечаем «только что добавлены» ДО записи.
      // Транзакция на коммите тригерит liveQuery → монтирует новые ряды; пометь мы
      // ПОСЛЕ await (как было) — ряды успели бы смонтироваться раньше флага и сыграть
      // быстрый 320ms stagger вместо появления. Теперь флаг в mailbox до коммита.
      const newScheduleIds: string[] = committed.map(() => crypto.randomUUID());
      const newDishItemIds: string[] = committed.map(() => crypto.randomUUID());
      const newRowIds = target.kind === 'schedule' ? newScheduleIds : newDishItemIds;
      if (newRowIds.length > 0) markAdded(newRowIds);
      if (target.kind === 'schedule') {
        const date = target.date;
        const result = await safeMutate(
          () =>
            db.transaction('rw', db.schedule_foods, async () => {
              for (const [i, c] of committed.entries()) {
                await addScheduleFood({
                  date,
                  time: c.time,
                  type: 'food',
                  quantity: c.quantity,
                  productId: c.productId,
                  details: c.details ?? '',
                  id: newScheduleIds[i],
                });
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
              for (const [i, c] of committed.entries()) {
                await addDishItem({
                  dishId,
                  productId: c.productId,
                  quantity: c.quantity,
                  // head A fills details (борщ→свекла «вареная»); persist it so
                  // it renders as the ingredient subtitle on the dish row.
                  details: c.details ?? '',
                  id: newDishItemIds[i],
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
      // Тост-подтверждение оставляем только для добавления в БЛЮДО (создание
      // ингредиентов). Для расписания уведомление о создании сущности убрано
      // (по запросу) — согласовано с food-entry-flow.
      if (target.kind === 'dish') {
        toaster.success(`Добавлено: ${committed.length}`);
      }

      // markAdded уже вызван ДО записи (см. выше) — здесь помечать поздно.
      // Haptic на успешное создание (progressive enhancement — no-op на iOS).
      haptic();

      // Подскролл к первой добавленной строке (паритет с модальным созданием —
      // см. food-entry-flow) на ОБОИХ экранах: еда в расписании и ингредиент блюда.
      const firstNewRowId =
        target.kind === 'schedule' ? newScheduleIds[0] : newDishItemIds[0];
      if (firstNewRowId) scrollToNewRow(firstNewRowId);

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
    haptic,
  ]);

  return {
    targetKind: target.kind,
    state,
    parseResult,
    inputText,
    errorMessage,
    submit,
    submitDishName,
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

    editingUid,
    editingStep,
    editingRowView,

    toggleResolved,
    toggleAmbiguous,
    toggleUnresolved,
    updateResolved,
    updateAmbiguous,
    updateUnresolved,
    startEdit,
    closeEdit,
    setEditingStep,
    handleEditChange,
    commit,
  };
}
