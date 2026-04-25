import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Screen } from '@/shared/ui/Screen';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import Button from '@/shared/ui/atoms/Button/Button';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { db } from '@/powersync/database';
import { supabase } from '@/powersync/supabase-client';
import { RouterUrls } from '@/app/router';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import {
  sendMatcherTelemetry,
  readParseState,
  clearParseState,
  FreeTextFoodReviewItem,
  useRecentlyAddedStore,
  type ParseTarget,
  type MatchCandidate,
  type ParseResponse,
  type ResolvedItem,
  type AmbiguousItem,
  type UnresolvedItem,
  type TelemetryCorrection,
  type TelemetryEventPayload,
} from '@/features/food/food-free-text-parse';
import type { FreeTextFoodMode, CommittedItem } from './mode';
import { DayContextBar } from './components/DayContextBar';
import { DishContextBar } from './components/DishContextBar';
import {
  FreeTextFoodReviewEditModals,
  type ReviewEditStep,
  type ReviewRowUpdates,
  type ReviewRowView,
} from './components/FreeTextFoodReviewEditModals';
import styles from './FreeTextFoodFlow.module.scss';

export interface FreeTextFoodFlowProps {
  mode: FreeTextFoodMode;
}

type ItemCategory = 'resolved' | 'ambiguous' | 'unresolved';

interface EditFlags {
  foodEdited: boolean;
  timeEdited: boolean;
  qtyEdited: boolean;
}

const EMPTY_FLAGS: EditFlags = { foodEdited: false, timeEdited: false, qtyEdited: false };

type ResolvedRow = ResolvedItem & { uid: string; enabled: boolean } & EditFlags;
type AmbiguousRow = AmbiguousItem & {
  uid: string;
  enabled: boolean;
  selectedId: string | null;
} & EditFlags;
type UnresolvedRow = UnresolvedItem & {
  uid: string;
  manual: MatchCandidate | null;
} & EditFlags;

const makeUid = () => Math.random().toString(36).slice(2, 10);

const REVIEW_INPUT_IDS = {
  TIME_INPUT: 'free-text-review-time',
  SEARCH_INPUT: 'free-text-review-search',
  QUANTITY_INPUT: 'free-text-review-quantity',
  DETAILS_INPUT: 'free-text-review-details',
} as const;

const INPUT_TO_STEP: Record<string, ReviewEditStep> = {
  [REVIEW_INPUT_IDS.TIME_INPUT]: 'time',
  [REVIEW_INPUT_IDS.SEARCH_INPUT]: 'search',
  [REVIEW_INPUT_IDS.QUANTITY_INPUT]: 'quantity',
  [REVIEW_INPUT_IDS.DETAILS_INPUT]: 'details',
};

export const FreeTextFoodFlow = ({ mode }: FreeTextFoodFlowProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scheduleDate = mode.kind === 'schedule' ? mode.date : null;

  const parseTarget = useMemo<ParseTarget | null>(() => {
    if (mode.kind === 'schedule') return { kind: 'schedule', date: mode.date };
    if (mode.kind === 'dish') return { kind: 'dish', dishId: mode.dishId };
    return null;
  }, [mode]);

  const [initialFromRouter] = useState<{ parseResult: ParseResponse; inputText: string } | null>(
    () => {
      const stateParse = (location.state as { parseResult?: ParseResponse } | null)?.parseResult;
      if (stateParse) return { parseResult: stateParse, inputText: '' };
      if (!parseTarget) return null;
      const persisted = readParseState(parseTarget);
      if (persisted && persisted.status === 'ready' && persisted.parseResult) {
        return { parseResult: persisted.parseResult, inputText: persisted.inputText };
      }
      return null;
    },
  );

  const [resolved, setResolved] = useState<ResolvedRow[]>([]);
  const [ambiguous, setAmbiguous] = useState<AmbiguousRow[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletedItem, setDeletedItem] = useState<{
    uid: string;
    type: ItemCategory;
    data: unknown;
  } | null>(null);

  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<ReviewEditStep>('idle');

  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestIdRef = useRef<string | null>(null);
  const matcherLatencyRef = useRef<number>(0);
  const reviewStartRef = useRef<number>(0);
  const deletedCountRef = useRef<number>(0);
  const telemetrySentRef = useRef<boolean>(false);
  const originalChoicesRef = useRef<
    Map<string, { originalName: string; matcherChoice: string }>
  >(new Map());

  useSwipeableLock(editingStep !== 'idle');

  const inputText = initialFromRouter?.inputText ?? '';

  useEffect(
    () => () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      sendTelemetryRef.current('abandon');
    },
    [],
  );

  const applyResponse = useCallback((response: ParseResponse) => {
    requestIdRef.current = response.requestId;
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
  }, []);

  // Hydrate review rows once on mount.
  useEffect(() => {
    if (!initialFromRouter) return;
    matcherLatencyRef.current = 0;
    reviewStartRef.current = Date.now();
    applyResponse(initialFromRouter.parseResult);
  }, []);

  const handleBack = useCallback(() => {
    sendTelemetryRef.current('abandon');
    if (scheduleDate) navigate(RouterUrls.Schedule(scheduleDate));
    else navigate('/');
  }, [navigate, scheduleDate]);

  // ─── Delete + Undo ───

  const scheduleUndoExpiry = useCallback(() => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setDeletedItem(null), 3000);
  }, []);

  const deleteItem = useCallback(
    (uid: string, type: ItemCategory, data: unknown) => {
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
        if (item) deleteItem(uid, 'resolved', item);
        return prev.filter((r) => r.uid !== uid);
      });
    },
    [deleteItem],
  );

  const deleteAmbiguous = useCallback(
    (uid: string) => {
      setAmbiguous((prev) => {
        const item = prev.find((a) => a.uid === uid);
        if (item) deleteItem(uid, 'ambiguous', item);
        return prev.filter((a) => a.uid !== uid);
      });
    },
    [deleteItem],
  );

  const deleteUnresolved = useCallback(
    (uid: string) => {
      setUnresolved((prev) => {
        const item = prev.find((u) => u.uid === uid);
        if (item) deleteItem(uid, 'unresolved', item);
        return prev.filter((u) => u.uid !== uid);
      });
    },
    [deleteItem],
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

  // ─── Update helpers ───

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

  // ─── Edit orchestration ───

  const findCategory = useCallback(
    (uid: string): ItemCategory | null => {
      if (resolved.some((r) => r.uid === uid)) return 'resolved';
      if (ambiguous.some((a) => a.uid === uid)) return 'ambiguous';
      if (unresolved.some((u) => u.uid === uid)) return 'unresolved';
      return null;
    },
    [resolved, ambiguous, unresolved],
  );

  const handleStartEdit = useCallback((uid: string, step: Exclude<ReviewEditStep, 'idle'>) => {
    setEditingUid(uid);
    setEditingStep(step);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingUid(null);
    setEditingStep('idle');
  }, []);

  const handleFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      const nextStep = INPUT_TO_STEP[target.id];
      if (!nextStep || !editingUid) return;
      setEditingStep(nextStep);
    },
    [editingUid],
  );

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
        details: r.note,
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
        details: a.note,
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
        details: u.note,
        originalName: u.originalName,
      };
    }
    return null;
  }, [editingUid, resolved, ambiguous, unresolved]);

  const handleRowChange = useCallback(
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
        if (updates.note !== undefined) u.note = updates.note;
        updateResolved(editingUid, u);
      } else if (cat === 'ambiguous') {
        const u: Partial<AmbiguousRow> = {};
        if (updates.time !== undefined) u.time = updates.time;
        if (updates.quantity !== undefined) u.quantity = updates.quantity;
        if (updates.productId !== undefined) u.selectedId = updates.productId;
        if (updates.note !== undefined) u.note = updates.note;
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
        if (updates.note !== undefined) u.note = updates.note;
        updateUnresolved(editingUid, u);
      }
    },
    [editingUid, findCategory, updateResolved, updateAmbiguous, updateUnresolved],
  );

  // ─── Commit ───

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const totalToAdd = useMemo(() => {
    const a = resolved.filter((r) => r.enabled).length;
    const b = ambiguous.filter((x) => x.enabled && x.selectedId).length;
    const c = unresolved.filter((u) => u.manual).length;
    return a + b + c;
  }, [resolved, ambiguous, unresolved]);

  const handleCommit = useCallback(async () => {
    if (isSubmitting || totalToAdd === 0) return;
    setIsSubmitting(true);
    try {
      const committed: CommittedItem[] = [];

      for (const r of resolved) {
        if (!r.enabled) continue;
        committed.push({
          productId: r.productId,
          quantity: r.quantity,
          time: r.time,
          note: r.note,
        });
      }

      for (const a of ambiguous) {
        if (!a.enabled || !a.selectedId) continue;
        committed.push({
          productId: a.selectedId,
          quantity: a.quantity,
          time: a.time,
          note: a.note,
        });
      }

      for (const u of unresolved) {
        if (!u.manual) continue;
        committed.push({
          productId: u.manual.id,
          quantity: u.quantity,
          time: u.time,
          note: u.note,
        });
      }

      if (committed.length === 0) {
        setIsSubmitting(false);
        return;
      }

      let ok: unknown;
      let newScheduleIds: string[] = [];
      if (mode.kind === 'schedule') {
        const date = mode.date;
        newScheduleIds = committed.map(() => crypto.randomUUID());
        ok = await safeMutate(async () => {
          const { data: userData, error } = await supabase.auth.getUser();
          if (error) throw error;
          if (!userData.user) throw new Error('Not authenticated');
          const writerUserId = userData.user.id;
          const now = new Date().toISOString();
          await db.writeTransaction(async (tx) => {
            for (let idx = 0; idx < committed.length; idx += 1) {
              const c = committed[idx];
              await tx.execute(
                `insert into schedule_foods
                   (id, user_id, date, time, type, quantity, details, product_id, dish_id, created_at)
                 values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  newScheduleIds[idx],
                  writerUserId,
                  date,
                  c.time,
                  'food',
                  c.quantity,
                  c.note ?? '',
                  c.productId,
                  '',
                  now,
                ],
              );
            }
          });
          return true;
        }, 'Не удалось добавить продукты');
      } else if (mode.kind === 'dish') {
        const dishId = mode.dishId;
        ok = await safeMutate(async () => {
          const { data: userData, error } = await supabase.auth.getUser();
          if (error) throw error;
          if (!userData.user) throw new Error('Not authenticated');
          const writerUserId = userData.user.id;
          const now = new Date().toISOString();
          await db.writeTransaction(async (tx) => {
            for (const c of committed) {
              await tx.execute(
                `insert into dish_items (id, user_id, dish_id, product_id, quantity, created_at)
                 values (?, ?, ?, ?, ?, ?)`,
                [
                  crypto.randomUUID(),
                  writerUserId,
                  dishId,
                  c.productId,
                  c.quantity,
                  now,
                ],
              );
            }
          });
          return true;
        }, 'Не удалось добавить продукты в блюдо');
      } else {
        mode.onCommit(committed);
        ok = true;
      }

      if (ok === undefined) {
        setIsSubmitting(false);
        return;
      }
      sendTelemetryIfNotSent('commit');
      toaster.success(`Добавлено: ${committed.length}`);

      if (parseTarget) clearParseState(parseTarget);

      if (mode.kind === 'schedule') {
        if (newScheduleIds.length > 0) {
          useRecentlyAddedStore.getState().addMany(newScheduleIds);
        }
        navigate(RouterUrls.Schedule(mode.date));
      } else if (mode.kind === 'dish') navigate(-1);
    } catch (e) {
      setIsSubmitting(false);
      const message = e instanceof Error ? e.message : 'Не удалось добавить продукты';
      toaster.error(message);
    }
  }, [
    isSubmitting,
    totalToAdd,
    resolved,
    ambiguous,
    unresolved,
    mode,
    navigate,
    sendTelemetryIfNotSent,
    parseTarget,
  ]);

  const isDishMode = mode.kind === 'dish';

  // ─── No parse result available — redirect ───

  if (!initialFromRouter) {
    return (
      <Navigate
        to={scheduleDate ? RouterUrls.Schedule(scheduleDate) : '/'}
        replace
      />
    );
  }

  // ─── ReviewStep ───

  const isEmpty =
    resolved.length === 0 && ambiguous.length === 0 && unresolved.length === 0;

  const addableCount = totalToAdd;
  const resolvedCount = resolved.length;
  const ambiguousCount = ambiguous.length;
  const unresolvedPending = unresolved.filter((u) => !u.manual).length;

  return (
    <Screen
      actions={
        <ActionsPanel show onBack={handleBack}>
          <Button
            variant="primary"
            onClick={handleCommit}
            disabled={isSubmitting || addableCount === 0}
          >
            {isSubmitting ? 'Добавляем…' : `Добавить ${addableCount}`}
          </Button>
        </ActionsPanel>
      }
    >
      <div className={styles.page} onFocusCapture={handleFocusCapture}>
        {mode.kind === 'schedule' && <DayContextBar date={mode.date} />}
        {mode.kind === 'dish' && <DishContextBar dishId={mode.dishId} />}
        <div className={styles.reviewStep}>
          {inputText && <div className={styles.originalText}>{inputText}</div>}

          {!isEmpty && (
            <div className={styles.summary}>
              {resolvedCount > 0 && (
                <span className={`${styles.summaryChip} ${styles.summaryChip_resolved}`}>
                  Распознано {resolvedCount}
                </span>
              )}
              {ambiguousCount > 0 && (
                <span className={`${styles.summaryChip} ${styles.summaryChip_ambiguous}`}>
                  Уточните {ambiguousCount}
                </span>
              )}
              {unresolvedPending > 0 && (
                <span
                  className={`${styles.summaryChip} ${styles.summaryChip_unresolved}`}
                >
                  Не найдено {unresolvedPending}
                </span>
              )}
            </div>
          )}

          {isEmpty ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>
                Ничего не распозналось. Попробуйте описать подробнее.
              </p>
            </div>
          ) : (
            <div className={styles.sections}>
              {resolved.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Распознано</h3>
                  <ul className={styles.list}>
                    {resolved.map((r) => (
                      <li key={r.uid}>
                        <FreeTextFoodReviewItem
                          uid={r.uid}
                          item={r}
                          hideTime={isDishMode}
                          onStartEdit={handleStartEdit}
                          onDeleteNote={() => updateResolved(r.uid, { note: '' })}
                          onDeleteItem={() => deleteResolved(r.uid)}
                          timeInputId={REVIEW_INPUT_IDS.TIME_INPUT}
                          quantityInputId={REVIEW_INPUT_IDS.QUANTITY_INPUT}
                          detailsInputId={REVIEW_INPUT_IDS.DETAILS_INPUT}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {ambiguous.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Уточните</h3>
                  <ul className={styles.list}>
                    {ambiguous.map((a) => {
                      const selected =
                        a.candidates.find((c) => c.id === a.selectedId) ??
                        a.candidates[0];
                      return (
                        <li key={a.uid}>
                          <FreeTextFoodReviewItem
                            uid={a.uid}
                            item={{
                              ...a,
                              name: selected?.name ?? '—',
                              productId: a.selectedId ?? '',
                            }}
                            hideTime={isDishMode}
                            isAmbiguous
                            candidates={a.candidates}
                            selectedCandidateId={a.selectedId}
                            onSelectCandidate={(id) =>
                              updateAmbiguous(a.uid, { selectedId: id })
                            }
                            onStartEdit={handleStartEdit}
                            onDeleteNote={() => updateAmbiguous(a.uid, { note: '' })}
                            onDeleteItem={() => deleteAmbiguous(a.uid)}
                            timeInputId={REVIEW_INPUT_IDS.TIME_INPUT}
                              quantityInputId={REVIEW_INPUT_IDS.QUANTITY_INPUT}
                            detailsInputId={REVIEW_INPUT_IDS.DETAILS_INPUT}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {unresolved.length > 0 && (
                <section className={styles.section}>
                  <h3 className={styles.sectionTitle}>Не распознано</h3>
                  <ul className={styles.list}>
                    {unresolved.map((u) => (
                      <li key={u.uid}>
                        <FreeTextFoodReviewItem
                          uid={u.uid}
                          item={{
                            ...u,
                            name: u.manual?.name ?? u.originalName,
                            productId: u.manual?.id ?? '',
                          }}
                          hideTime={isDishMode}
                          isUnresolved={!u.manual}
                          onStartEdit={handleStartEdit}
                          onDeleteNote={() => updateUnresolved(u.uid, { note: '' })}
                          onDeleteItem={() => deleteUnresolved(u.uid)}
                          timeInputId={REVIEW_INPUT_IDS.TIME_INPUT}
                          quantityInputId={REVIEW_INPUT_IDS.QUANTITY_INPUT}
                          detailsInputId={REVIEW_INPUT_IDS.DETAILS_INPUT}
                        />
                      </li>
                    ))}
                  </ul>
                  <p className={styles.unresolvedFootnote}>
                    Без выбора эти пункты будут пропущены.
                  </p>
                </section>
              )}
            </div>
          )}
        </div>

        <FreeTextFoodReviewEditModals
          row={editingRowView}
          step={editingStep}
          hideTime={isDishMode}
          onChange={handleRowChange}
          onClose={closeEdit}
          inputIds={REVIEW_INPUT_IDS}
        />
      </div>

      {deletedItem && (
        <div className={styles.undoSnackbar}>
          <span>Удалено</span>
          <button type="button" className={styles.undoBtn} onClick={handleUndo}>
            ← Отменить
          </button>
        </div>
      )}
    </Screen>
  );
};

export default FreeTextFoodFlow;
