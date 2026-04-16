import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@livestore/react';
import { Screen } from '@/shared/ui/Screen';
import { ActionsPanel } from '@/shared/ui/ActionsPanel';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import Button from '@/shared/ui/atoms/Button/Button';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { events } from '@/livestore/schema';
import { getCurrentUserId } from '@/shared/lib/user';
import { RouterUrls } from '@/app/router';
import {
  parseFreeTextFood,
  type MatchCandidate,
  type ParseResponse,
} from '@/features/daySchedule/free-text-food/api';
import type { ResolvedItem, AmbiguousItem, UnresolvedItem } from '@/features/daySchedule/free-text-food/api';
import { openFreeTextFoodSearch } from '@/features/daySchedule/free-text-food/openFreeTextFoodSearch';
import { FreeTextFoodReviewItem } from './components/FreeTextFoodReviewItem';
import styles from './FreeTextFoodPage.module.scss';

type Step = 'input' | 'loading' | 'review';
type ItemCategory = 'resolved' | 'ambiguous' | 'unresolved';

type ResolvedRow = ResolvedItem & { uid: string; enabled: boolean };
type AmbiguousRow = AmbiguousItem & {
  uid: string;
  enabled: boolean;
  selectedId: string | null;
};
type UnresolvedRow = UnresolvedItem & { uid: string; manual: MatchCandidate | null };

const makeUid = () => Math.random().toString(36).slice(2, 10);

const PLACEHOLDER =
  'Например: на завтрак овсянка с бананом, в обед борщ с хлебом';

const FreeTextFoodPage = () => {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { store } = useStore();

  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedRow[]>([]);
  const [ambiguous, setAmbiguous] = useState<AmbiguousRow[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletedItem, setDeletedItem] = useState<{ uid: string; type: ItemCategory; data: unknown } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!date) navigate('/');
  }, [date, navigate]);

  const applyResponse = useCallback((response: ParseResponse) => {
    setResolved(
      response.resolved.map((r) => ({ ...r, uid: makeUid(), enabled: true })),
    );
    setAmbiguous(
      response.ambiguous.map((a) => ({
        ...a,
        uid: makeUid(),
        enabled: true,
        selectedId: a.candidates[0]?.id ?? null,
      })),
    );
    setUnresolved(
      response.unresolved.map((u) => ({ ...u, uid: makeUid(), manual: null })),
    );
  }, []);

  const handleParse = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    setStep('loading');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await parseFreeTextFood(trimmed, controller.signal);
      if (controller.signal.aborted) return;
      applyResponse(response);
      setStep('review');
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : 'Не удалось разобрать текст';
      setError(message);
      setStep('input');
    }
  }, [text, applyResponse]);

  const handleCancelLoading = useCallback(() => {
    abortRef.current?.abort();
    setStep('input');
  }, []);

  const handleBack = useCallback(() => {
    if (date) navigate(RouterUrls.Schedule(date));
    else navigate('/');
  }, [navigate, date]);

  // ─── Delete + Undo ───

  const scheduleUndoExpiry = useCallback(() => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => setDeletedItem(null), 3000);
  }, []);

  const deleteItem = useCallback((uid: string, type: ItemCategory, data: unknown) => {
    setDeletedItem({ uid, type, data });
    scheduleUndoExpiry();
  }, [scheduleUndoExpiry]);

  const deleteResolved = useCallback((uid: string) => {
    setResolved((prev) => {
      const item = prev.find((r) => r.uid === uid);
      if (item) deleteItem(uid, 'resolved', item);
      return prev.filter((r) => r.uid !== uid);
    });
  }, [deleteItem]);

  const deleteAmbiguous = useCallback((uid: string) => {
    setAmbiguous((prev) => {
      const item = prev.find((a) => a.uid === uid);
      if (item) deleteItem(uid, 'ambiguous', item);
      return prev.filter((a) => a.uid !== uid);
    });
  }, [deleteItem]);

  const deleteUnresolved = useCallback((uid: string) => {
    setUnresolved((prev) => {
      const item = prev.find((u) => u.uid === uid);
      if (item) deleteItem(uid, 'unresolved', item);
      return prev.filter((u) => u.uid !== uid);
    });
  }, [deleteItem]);

  const handleUndo = useCallback(() => {
    if (!deletedItem) return;
    if (deletedItem.type === 'resolved')
      setResolved((prev) => [...prev, deletedItem.data as ResolvedRow]);
    else if (deletedItem.type === 'ambiguous')
      setAmbiguous((prev) => [...prev, deletedItem.data as AmbiguousRow]);
    else
      setUnresolved((prev) => [...prev, deletedItem.data as UnresolvedRow]);
    setDeletedItem(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  }, [deletedItem]);

  // ─── Update helpers ───

  const updateResolved = useCallback((uid: string, updates: Partial<ResolvedRow>) => {
    setResolved((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...updates } : r)));
  }, []);

  const updateAmbiguous = useCallback((uid: string, updates: Partial<AmbiguousRow>) => {
    setAmbiguous((prev) => prev.map((a) => (a.uid === uid ? { ...a, ...updates } : a)));
  }, []);

  const updateUnresolved = useCallback((uid: string, updates: Partial<UnresolvedRow>) => {
    setUnresolved((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...updates } : u)));
  }, []);

  const handleFindManually = useCallback(async (uid: string) => {
    const row = unresolved.find((u) => u.uid === uid);
    if (!row) return;
    const picked = await openFreeTextFoodSearch(row.originalName);
    if (!picked) return;
    updateUnresolved(uid, { manual: picked });
  }, [unresolved, updateUnresolved]);

  // ─── Commit ───

  const userId = useMemo(() => getCurrentUserId(), []);

  const totalToAdd = useMemo(() => {
    const a = resolved.filter((r) => r.enabled).length;
    const b = ambiguous.filter((a) => a.enabled && a.selectedId).length;
    const c = unresolved.filter((u) => u.manual).length;
    return a + b + c;
  }, [resolved, ambiguous, unresolved]);

  const handleCommit = useCallback(() => {
    if (isSubmitting || totalToAdd === 0 || !date) return;
    setIsSubmitting(true);
    try {
      const payloads: Parameters<typeof events.scheduleFoodCreated>[0][] = [];

      for (const r of resolved) {
        if (!r.enabled) continue;
        payloads.push({
          id: crypto.randomUUID(),
          date,
          time: r.time,
          type: 'food',
          quantity: r.quantity,
          details: r.note,
          productId: r.productId,
          dishId: '',
          userId,
        });
      }

      for (const a of ambiguous) {
        if (!a.enabled || !a.selectedId) continue;
        payloads.push({
          id: crypto.randomUUID(),
          date,
          time: a.time,
          type: 'food',
          quantity: a.quantity,
          details: a.note,
          productId: a.selectedId,
          dishId: '',
          userId,
        });
      }

      for (const u of unresolved) {
        if (!u.manual) continue;
        payloads.push({
          id: crypto.randomUUID(),
          date,
          time: u.time,
          type: 'food',
          quantity: u.quantity,
          details: u.note,
          productId: u.manual.id,
          dishId: '',
          userId,
        });
      }

      if (payloads.length === 0) {
        setIsSubmitting(false);
        return;
      }

      const ok = safeMutate(
        () => store.commit(...payloads.map((p) => events.scheduleFoodCreated(p))),
        'Не удалось добавить продукты',
      );
      if (ok === undefined) {
        setIsSubmitting(false);
        return;
      }
      toaster.success(`Добавлено: ${payloads.length}`);
      navigate(RouterUrls.Schedule(date));
    } catch (e) {
      setIsSubmitting(false);
      const message = e instanceof Error ? e.message : 'Не удалось добавить продукты';
      toaster.error(message);
    }
  }, [isSubmitting, totalToAdd, resolved, ambiguous, unresolved, date, userId, store, navigate]);

  if (!date) return null;

  // ─── InputStep ───

  if (step === 'input') {
    return (
      <Screen
        actions={
          <ActionsPanel show onBack={handleBack}>
            <Button variant="primary" onClick={handleParse} disabled={!text.trim()}>
              Разобрать
            </Button>
          </ActionsPanel>
        }
      >
        <div className={styles.container}>
          <h2 className={styles.stepTitle}>Расскажите, что вы ели</h2>
          <Textarea
            value={text}
            onChange={setText}
            placeholder={PLACEHOLDER}
            rows={6}
            maxLength={2000}
            autoFocus
          />
          <p className={styles.hint}>
            Можно надиктовать голосом через микрофон на клавиатуре.
          </p>
          {error && <div className={styles.error}>{error}</div>}
        </div>
      </Screen>
    );
  }

  // ─── LoadingStep ───

  if (step === 'loading') {
    return (
      <Screen
        actions={
          <ActionsPanel show onBack={handleBack}>
            <Button variant="secondary" onClick={handleCancelLoading}>
              Отмена
            </Button>
          </ActionsPanel>
        }
      >
        <div className={styles.loadingContainer}>
          <Spinner size={44} />
          <p className={styles.loadingText}>Распознаём продукты…</p>
          <p className={styles.loadingHint}>
            Обычно 10–30 секунд.
          </p>
        </div>
      </Screen>
    );
  }

  // ─── ReviewStep ───

  const isEmpty =
    resolved.length === 0 && ambiguous.length === 0 && unresolved.length === 0;

  return (
    <Screen
      actions={
        <ActionsPanel show onBack={handleBack}>
          <Button
            variant="primary"
            onClick={handleCommit}
            disabled={isSubmitting || totalToAdd === 0}
          >
            {isSubmitting ? 'Добавляем…' : `Добавить (${totalToAdd})`}
          </Button>
        </ActionsPanel>
      }
    >
      <div className={styles.container}>
        <h2 className={styles.stepTitle}>Проверьте результат</h2>

        {/* Оригинальный текст (read-only) */}
        <div className={styles.originalText}>{text}</div>

        {isEmpty ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              Ничего не распозналось. Попробуйте описать подробнее.
            </p>
            <Button variant="secondary" onClick={() => setStep('input')}>
              Попробовать снова
            </Button>
          </div>
        ) : (
          <>
            {resolved.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Распознано ({resolved.length})
                </h3>
                <ul className={styles.list}>
                  {resolved.map((r) => (
                    <li key={r.uid}>
                      <FreeTextFoodReviewItem
                        item={r}
                        onDeleteNote={() => updateResolved(r.uid, { note: '' })}
                        onDeleteItem={() => deleteResolved(r.uid)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {ambiguous.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Уточните ({ambiguous.length})
                </h3>
                <ul className={styles.list}>
                  {ambiguous.map((a) => {
                    const selected =
                      a.candidates.find((c) => c.id === a.selectedId) ??
                      a.candidates[0];
                    return (
                      <li key={a.uid}>
                        <FreeTextFoodReviewItem
                          item={{
                            ...a,
                            name: selected?.name ?? '—',
                            productId: a.selectedId ?? '',
                          }}
                          isAmbiguous
                          candidates={a.candidates}
                          selectedCandidateId={a.selectedId}
                          onSelectCandidate={(id) =>
                            updateAmbiguous(a.uid, { selectedId: id })
                          }
                          onDeleteNote={() => updateAmbiguous(a.uid, { note: '' })}
                          onDeleteItem={() => deleteAmbiguous(a.uid)}
                        />
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {unresolved.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Не распознано ({unresolved.length})
                </h3>
                <ul className={styles.list}>
                  {unresolved.map((u) => (
                    <li key={u.uid}>
                      <FreeTextFoodReviewItem
                        item={{
                          ...u,
                          name: u.manual?.name ?? u.originalName,
                          productId: u.manual?.id ?? '',
                        }}
                        isUnresolved={!u.manual}
                        onFindManually={() => handleFindManually(u.uid)}
                        onDeleteNote={() => updateUnresolved(u.uid, { note: '' })}
                        onDeleteItem={() => deleteUnresolved(u.uid)}
                      />
                    </li>
                  ))}
                </ul>
                <p className={styles.unresolvedFootnote}>
                  Без выбора эти пункты будут пропущены.
                </p>
              </section>
            )}
          </>
        )}
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

export default FreeTextFoodPage;
