import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@livestore/react';
import clsx from 'clsx';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { type BaseModalProps } from '@/shared/ui';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import Button from '@/shared/ui/atoms/Button/Button';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { events } from '@/livestore/schema';
import { getCurrentUserId } from '@/shared/lib/user';
import {
  parseFreeTextFood,
  type AmbiguousItem,
  type MatchCandidate,
  type ParseResponse,
  type ResolvedItem,
  type UnresolvedItem,
} from './api';
import { openFreeTextFoodSearch } from './openFreeTextFoodSearch';
import styles from './FreeTextFoodModal.module.scss';

type Step = 'input' | 'loading' | 'result';

type Props = BaseModalProps<boolean> & {
  date: string;
};

type ResolvedRow = ResolvedItem & { uid: string; enabled: boolean };
type AmbiguousRow = AmbiguousItem & {
  uid: string;
  enabled: boolean;
  selectedId: string | null;
  expanded: boolean;
};
type UnresolvedRow = UnresolvedItem & { uid: string; manual: MatchCandidate | null };

const makeUid = () => Math.random().toString(36).slice(2, 10);

const PLACEHOLDER =
  'Например: на завтрак овсянка с бананом, в обед борщ с хлебом';

const FreeTextFoodModal = ({ date, onClose }: Props) => {
  const { store } = useStore();
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState<ResolvedRow[]>([]);
  const [ambiguous, setAmbiguous] = useState<AmbiguousRow[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

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
        expanded: false,
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
      setStep('result');
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

  const handleRetry = useCallback(() => {
    setStep('input');
    setResolved([]);
    setAmbiguous([]);
    setUnresolved([]);
  }, []);

  const toggleResolved = (uid: string) =>
    setResolved((prev) => prev.map((r) => (r.uid === uid ? { ...r, enabled: !r.enabled } : r)));

  const toggleAmbiguous = (uid: string) =>
    setAmbiguous((prev) => prev.map((a) => (a.uid === uid ? { ...a, enabled: !a.enabled } : a)));

  const expandAmbiguous = (uid: string) =>
    setAmbiguous((prev) => prev.map((a) => (a.uid === uid ? { ...a, expanded: !a.expanded } : a)));

  const selectAmbiguous = (uid: string, candidateId: string) =>
    setAmbiguous((prev) =>
      prev.map((a) =>
        a.uid === uid ? { ...a, selectedId: candidateId, expanded: false } : a,
      ),
    );

  const skipAmbiguous = (uid: string) =>
    setAmbiguous((prev) =>
      prev.map((a) => (a.uid === uid ? { ...a, enabled: false, expanded: false } : a)),
    );

  const findManually = useCallback(async (uid: string) => {
    const row = unresolved.find((u) => u.uid === uid);
    if (!row) return;
    const picked = await openFreeTextFoodSearch(row.originalName);
    if (!picked) return;
    setUnresolved((prev) => prev.map((u) => (u.uid === uid ? { ...u, manual: picked } : u)));
  }, [unresolved]);

  const removeUnresolvedManual = (uid: string) =>
    setUnresolved((prev) => prev.map((u) => (u.uid === uid ? { ...u, manual: null } : u)));

  const userId = useMemo(() => getCurrentUserId(), []);

  const totalToAdd = useMemo(() => {
    const a = resolved.filter((r) => r.enabled).length;
    const b = ambiguous.filter((a) => a.enabled && a.selectedId).length;
    const c = unresolved.filter((u) => u.manual).length;
    return a + b + c;
  }, [resolved, ambiguous, unresolved]);

  const handleCommit = useCallback(() => {
    if (isSubmitting || totalToAdd === 0) return;
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
          details: '',
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
          details: '',
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
          details: '',
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
      onClose(true);
    } catch (e) {
      setIsSubmitting(false);
      const message = e instanceof Error ? e.message : 'Не удалось добавить продукты';
      toaster.error(message);
    }
  }, [isSubmitting, totalToAdd, resolved, ambiguous, unresolved, date, userId, store, onClose]);

  return (
    <ModalLayout>
      <div className={styles.root}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => onClose(false)}
          >
            ✕
          </button>
          <div className={styles.titleWrap}>
            <span className={styles.kicker}>Свободный ввод</span>
            <span className={styles.title}>
              {step === 'input' && 'Расскажите, что вы ели'}
              {step === 'loading' && 'Разбираем…'}
              {step === 'result' && 'Проверьте результат'}
            </span>
          </div>
        </div>

        <div className={styles.body}>
          {step === 'input' && (
            <InputStep
              text={text}
              onTextChange={setText}
              error={error}
              onSubmit={handleParse}
            />
          )}

          {step === 'loading' && <LoadingStep onCancel={handleCancelLoading} />}

          {step === 'result' && (
            <ResultStep
              resolved={resolved}
              ambiguous={ambiguous}
              unresolved={unresolved}
              onToggleResolved={toggleResolved}
              onToggleAmbiguous={toggleAmbiguous}
              onExpandAmbiguous={expandAmbiguous}
              onSelectAmbiguous={selectAmbiguous}
              onSkipAmbiguous={skipAmbiguous}
              onFindManually={findManually}
              onRemoveManual={removeUnresolvedManual}
              onRetry={handleRetry}
            />
          )}
        </div>

        {step === 'result' && (
          <div className={styles.footer}>
            <span className={styles.footerHint}>
              Количество и время можно изменить после добавления
            </span>
            <Button
              variant="primary"
              onClick={handleCommit}
              disabled={isSubmitting || totalToAdd === 0}
            >
              {isSubmitting ? 'Добавляем…' : `Добавить (${totalToAdd})`}
            </Button>
          </div>
        )}
      </div>
    </ModalLayout>
  );
};

/* ─── Input step ─────────────────────────────────────────── */

type InputStepProps = {
  text: string;
  onTextChange: (v: string) => void;
  error: string | null;
  onSubmit: () => void;
};

const InputStep = ({ text, onTextChange, error, onSubmit }: InputStepProps) => (
  <div className={styles.inputStep}>
    <Textarea
      value={text}
      onChange={onTextChange}
      placeholder={PLACEHOLDER}
      rows={6}
      maxLength={2000}
      autoFocus
    />
    <p className={styles.hint}>
      Можно надиктовать голосом через микрофон на клавиатуре.
    </p>
    {error && <div className={styles.error}>{error}</div>}
    <div className={styles.inputActions}>
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={!text.trim()}
      >
        Разобрать
      </Button>
    </div>
  </div>
);

/* ─── Loading step ───────────────────────────────────────── */

const LoadingStep = ({ onCancel }: { onCancel: () => void }) => (
  <div className={styles.loadingStep}>
    <Spinner size={44} />
    <p className={styles.loadingText}>Распознаём продукты…</p>
    <p className={styles.loadingHint}>
      Обычно 10–30 секунд. Отмена прекратит ожидание, но расчёт на сервере продолжится.
    </p>
    <Button variant="secondary" onClick={onCancel}>
      Отмена
    </Button>
  </div>
);

/* ─── Result step ────────────────────────────────────────── */

type ResultStepProps = {
  resolved: ResolvedRow[];
  ambiguous: AmbiguousRow[];
  unresolved: UnresolvedRow[];
  onToggleResolved: (uid: string) => void;
  onToggleAmbiguous: (uid: string) => void;
  onExpandAmbiguous: (uid: string) => void;
  onSelectAmbiguous: (uid: string, candidateId: string) => void;
  onSkipAmbiguous: (uid: string) => void;
  onFindManually: (uid: string) => void;
  onRemoveManual: (uid: string) => void;
  onRetry: () => void;
};

const ResultStep = ({
  resolved,
  ambiguous,
  unresolved,
  onToggleResolved,
  onToggleAmbiguous,
  onExpandAmbiguous,
  onSelectAmbiguous,
  onSkipAmbiguous,
  onFindManually,
  onRemoveManual,
  onRetry,
}: ResultStepProps) => {
  const isEmpty = resolved.length === 0 && ambiguous.length === 0 && unresolved.length === 0;

  if (isEmpty) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>
          Ничего не распозналось. Попробуйте описать подробнее.
        </p>
        <Button variant="secondary" onClick={onRetry}>
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.result}>
      {resolved.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Распознано ({resolved.length})</h3>
          <ul className={styles.list}>
            {resolved.map((r) => (
              <li key={r.uid} className={clsx(styles.row, !r.enabled && styles.rowMuted)}>
                <Checkbox checked={r.enabled} onChange={() => onToggleResolved(r.uid)} />
                <div className={styles.rowBody}>
                  <div className={styles.rowName}>{r.name}</div>
                  <div className={styles.rowMeta}>
                    <span>{r.time}</span>
                    <span>·</span>
                    <span>
                      {r.quantity} г
                      {r.quantityGuessed && <GuessedBadge />}
                    </span>
                    {r.originalName.toLowerCase() !== r.name.toLowerCase() && (
                      <span className={styles.origHint}>из «{r.originalName}»</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ambiguous.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Уточните ({ambiguous.length})</h3>
          <ul className={styles.list}>
            {ambiguous.map((a) => {
              const selected = a.candidates.find((c) => c.id === a.selectedId) ?? a.candidates[0];
              return (
                <li
                  key={a.uid}
                  className={clsx(styles.row, !a.enabled && styles.rowMuted)}
                >
                  <Checkbox checked={a.enabled} onChange={() => onToggleAmbiguous(a.uid)} />
                  <div className={styles.rowBody}>
                    <div
                      className={styles.rowHeadRow}
                      onClick={() => a.enabled && onExpandAmbiguous(a.uid)}
                    >
                      <div className={styles.rowName}>
                        {selected?.name ?? '—'}
                        <span className={styles.questionMark}>?</span>
                      </div>
                      <div className={styles.rowMeta}>
                        <span>{a.time}</span>
                        <span>·</span>
                        <span>
                          {a.quantity} г
                          {a.quantityGuessed && <GuessedBadge />}
                        </span>
                        <span className={styles.origHint}>из «{a.originalName}»</span>
                      </div>
                    </div>

                    {a.enabled && a.expanded && (
                      <div className={styles.chooser}>
                        {a.candidates.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className={clsx(
                              styles.chooserOption,
                              c.id === a.selectedId && styles.chooserOptionActive,
                            )}
                            onClick={() => onSelectAmbiguous(a.uid, c.id)}
                          >
                            <span className={styles.chooserName}>{c.name}</span>
                            <span className={styles.chooserScore}>{c.score.toFixed(2)}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          className={styles.chooserSkip}
                          onClick={() => onSkipAmbiguous(a.uid)}
                        >
                          Ничего из предложенного
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {unresolved.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Не распознано ({unresolved.length})</h3>
          <ul className={styles.list}>
            {unresolved.map((u) => (
              <li key={u.uid} className={styles.row}>
                <div className={clsx(styles.unresolvedDot, u.manual && styles.unresolvedDotResolved)} />
                <div className={styles.rowBody}>
                  <div className={styles.rowName}>
                    {u.manual ? u.manual.name : u.originalName}
                  </div>
                  <div className={styles.rowMeta}>
                    <span>{u.time}</span>
                    <span>·</span>
                    <span>
                      {u.quantity} г
                      {u.quantityGuessed && <GuessedBadge />}
                    </span>
                    {u.manual && (
                      <span className={styles.origHint}>из «{u.originalName}»</span>
                    )}
                  </div>
                  <div className={styles.unresolvedActions}>
                    {u.manual ? (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => onRemoveManual(u.uid)}
                      >
                        Убрать выбор
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => onFindManually(u.uid)}
                      >
                        Найти вручную
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className={styles.unresolvedFootnote}>
            Без выбора эти пункты будут пропущены.
          </p>
        </section>
      )}
    </div>
  );
};

/* ─── Small UI helpers ────────────────────────────────────── */

const Checkbox = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    className={clsx(styles.checkbox, checked && styles.checkboxChecked)}
    onClick={onChange}
  >
    {checked && (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
        <path
          d="M3 8.5l3 3 7-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </button>
);

const GuessedBadge = () => <span className={styles.guessedBadge}>оценено</span>;

export default FreeTextFoodModal;
