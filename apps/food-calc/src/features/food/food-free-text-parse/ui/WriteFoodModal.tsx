import { useCallback, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import { useSwipeableLock } from '@/shared/ui/Swipeable/SwipeableLockContext';
import { createProduct } from '@/entities/product/api/mutations';
import { safeMutate } from '@/shared/lib/safeMutate';
import type { UseWriteFoodFlowResult, ReviewEditStep } from '../model/useWriteFoodFlow';
import { FreeTextFoodReviewItem } from './FreeTextFoodReviewItem';
import { FreeTextFoodReviewEditModals } from './FreeTextFoodReviewEditModals';
import { AddToListPopover } from './AddToListPopover';
import styles from './WriteFoodModal.module.scss';

export interface WriteFoodModalProps {
  isExpanded: boolean;
  onClose: () => void;
  flow: UseWriteFoodFlowResult;
  placeholder: string;
  inputId: string;
}

const DEFAULT_PLACEHOLDER = 'На завтрак овсянка 200, кофе.';

const REVIEW_INPUT_IDS = {
  SEARCH_INPUT: 'write-food-review-search',
  DETAILS_INPUT: 'write-food-review-details',
} as const;

const INPUT_TO_STEP: Record<string, ReviewEditStep> = {
  [REVIEW_INPUT_IDS.SEARCH_INPUT]: 'search',
  [REVIEW_INPUT_IDS.DETAILS_INPUT]: 'details',
};

interface RescueState {
  uid: string;
  anchor: HTMLElement;
  originalName: string;
}

export const WriteFoodModal = ({
  isExpanded,
  onClose,
  flow,
  placeholder,
  inputId,
}: WriteFoodModalProps) => {
  const online = useOnline();
  const {
    state,
    inputText,
    errorMessage,
    submit,
    retry,
    cancel,
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
  } = flow;

  useSwipeableLock(isExpanded && editingStep !== 'idle');

  const [rescue, setRescue] = useState<RescueState | null>(null);

  const readyCount =
    resolved.length + ambiguous.length + unresolved.length;
  const isReviewEmpty = state === 'ready' && readyCount === 0;
  // Цитата ввода полезна когда есть что сверять — иначе она просто дублирует
  // имена в рядах (см. /critique 2026-05-21: /critique). Скрываем когда всё
  // resolved.
  const showOriginalText =
    state === 'ready' && (ambiguous.length > 0 || unresolved.length > 0);

  const handleCancel = useCallback(() => {
    cancel();
    onClose();
  }, [cancel, onClose]);

  const handleMinimize = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleCommit = useCallback(async () => {
    const ok = await commit();
    if (ok) onClose();
  }, [commit, onClose]);

  const handleReviewFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      const nextStep = INPUT_TO_STEP[target.id];
      if (!nextStep || !editingUid) return;
      setEditingStep(nextStep);
    },
    [editingUid, setEditingStep],
  );

  const closeRescue = useCallback(() => setRescue(null), []);

  const handleRescueUseExisting = useCallback(
    (productId: string, name: string) => {
      if (!rescue) return;
      updateUnresolved(rescue.uid, {
        manual: { id: productId, name, score: 1 },
      });
      setRescue(null);
    },
    [rescue, updateUnresolved],
  );

  const handleRescueCreateNew = useCallback(
    async (name: string) => {
      if (!rescue) return;
      const result = await safeMutate(
        () => createProduct({ name }),
        'Не удалось создать продукт',
      );
      if (!result.ok) return;
      updateUnresolved(rescue.uid, {
        manual: { id: result.value, name, score: 1 },
      });
      setRescue(null);
    },
    [rescue, updateUnresolved],
  );

  // Back в режиме loading = свернуть (джоба продолжается в фоне);
  // ready = свернуть (результат лежит в storage); остальное = отменить.
  const handleBack =
    state === 'loading' || state === 'ready' ? handleMinimize : handleCancel;

  const title =
    state === 'idle'
      ? 'Опишите, что вы ели'
      : state === 'loading'
        ? 'Думаем…'
        : state === 'ready'
          ? `Готово · ${readyCount} ${pluralizeItems(readyCount)}`
          : 'Не получилось';

  const readOnly = state === 'loading';

  return (
    <ModalByLabel
      position="absolute"
      isExpanded={isExpanded}
      content={
        <ModalShell variant="spring4">
          <ModalShell.Header title={title} onBack={handleBack} />
          <ModalShell.Body>
            {/*
              Инпут всегда в DOM: htmlFor у WriteFoodButton делегирует
              focus сюда даже когда модалка закрыта на ready-стейте.
              Без этого «К проверке» из bottom-bar ничего не делает.
            */}
            <div
              className={
                state === 'ready' ? styles.inputHidden : styles.textareaWrap
              }
            >
              <AutoGrowSearch
                id={inputId}
                value={inputText}
                onChange={setInputText}
                placeholder={placeholder || DEFAULT_PLACEHOLDER}
                maxLength={2000}
                readOnly={readOnly}
              />
              {state === 'loading' && (
                <div className={styles.loadingBlock}>
                  <Spinner size={36} />
                  <p className={styles.loadingCopy}>
                    ~25 сек · можно свернуть
                  </p>
                </div>
              )}
            </div>

            {state === 'ready' && (
              <div
                className={styles.reviewWrap}
                onFocusCapture={handleReviewFocusCapture}
              >
                {showOriginalText && inputText && (
                  <div className={styles.originalText}>{inputText}</div>
                )}

                {isReviewEmpty ? (
                  <div className={styles.empty}>
                    <p className={styles.emptyText}>
                      Ничего не распозналось. Попробуйте описать подробнее.
                    </p>
                  </div>
                ) : (
                  <div className={styles.sections}>
                    {resolved.length > 0 && (
                      <section className={styles.section}>
                        <ul className={styles.list}>
                          {resolved.map((r) => (
                            <li key={r.uid}>
                              <FreeTextFoodReviewItem
                                uid={r.uid}
                                item={r}
                                hideTime={hideTime}
                                onStartEdit={startEdit}
                                onDeleteNote={() =>
                                  updateResolved(r.uid, { details: '' })
                                }
                                onDeleteItem={() => deleteResolved(r.uid)}
                                onCommitTime={(uid, time) =>
                                  updateResolved(uid, { time })
                                }
                                onCommitQuantity={(uid, quantity) =>
                                  updateResolved(uid, { quantity })
                                }
                                searchInputId={REVIEW_INPUT_IDS.SEARCH_INPUT}
                                detailsInputId={REVIEW_INPUT_IDS.DETAILS_INPUT}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {ambiguous.length > 0 && (
                      <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                          Уточните
                          <span className={styles.sectionCount}>
                            {ambiguous.length}
                          </span>
                        </h3>
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
                                  hideTime={hideTime}
                                  isAmbiguous
                                  candidates={a.candidates}
                                  selectedCandidateId={a.selectedId}
                                  onSelectCandidate={(id) =>
                                    updateAmbiguous(a.uid, { selectedId: id })
                                  }
                                  onStartEdit={startEdit}
                                  onDeleteNote={() =>
                                    updateAmbiguous(a.uid, { details: '' })
                                  }
                                  onDeleteItem={() => deleteAmbiguous(a.uid)}
                                  onCommitTime={(uid, time) =>
                                    updateAmbiguous(uid, { time })
                                  }
                                  onCommitQuantity={(uid, quantity) =>
                                    updateAmbiguous(uid, { quantity })
                                  }
                                  searchInputId={REVIEW_INPUT_IDS.SEARCH_INPUT}
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
                        <h3 className={styles.sectionTitle}>
                          Не распознано
                          <span className={styles.sectionCount}>
                            {unresolved.length}
                          </span>
                        </h3>
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
                                hideTime={hideTime}
                                isUnresolved={!u.manual}
                                wasRescued={!!u.manual}
                                onStartEdit={startEdit}
                                onDeleteNote={() =>
                                  updateUnresolved(u.uid, { details: '' })
                                }
                                onDeleteItem={() => deleteUnresolved(u.uid)}
                                onCommitTime={(uid, time) =>
                                  updateUnresolved(uid, { time })
                                }
                                onCommitQuantity={(uid, quantity) =>
                                  updateUnresolved(uid, { quantity })
                                }
                                onClickRescue={(uid, anchor) =>
                                  setRescue({
                                    uid,
                                    anchor,
                                    originalName: u.originalName,
                                  })
                                }
                                searchInputId={REVIEW_INPUT_IDS.SEARCH_INPUT}
                                detailsInputId={REVIEW_INPUT_IDS.DETAILS_INPUT}
                              />
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                )}

                <FreeTextFoodReviewEditModals
                  row={editingRowView}
                  step={editingStep}
                  onChange={handleEditChange}
                  onClose={closeEdit}
                  inputIds={REVIEW_INPUT_IDS}
                />

                <AddToListPopover
                  anchor={rescue?.anchor ?? null}
                  open={!!rescue}
                  initialName={rescue?.originalName ?? ''}
                  onClose={closeRescue}
                  onUseExisting={handleRescueUseExisting}
                  onCreateNew={handleRescueCreateNew}
                />

                {deletedItem && (
                  <div className={styles.undoSnackbar}>
                    <span>Удалено</span>
                    <button
                      type="button"
                      className={styles.undoBtn}
                      onClick={handleUndo}
                    >
                      ← Отменить
                    </button>
                  </div>
                )}
              </div>
            )}

            {state === 'error' && errorMessage && (
              <div className={styles.error}>{errorMessage}</div>
            )}

            {state === 'idle' && !online && (
              <div className={styles.offlineNotice}>
                Нет интернета. Подключитесь, чтобы обработать текст.
              </div>
            )}

            <ModalShell.ActionButtons
              debugId="write-food"
              right={
                state === 'idle' ? (
                  <ModalNextButton
                    onClick={() => {
                      if (!online) return;
                      submit(inputText);
                    }}
                    label={online ? 'Отправить' : 'Нет сети'}
                  />
                ) : state === 'loading' ? (
                  <ModalNextButton onClick={() => {}} label="Ожидаем…" disabled />
                ) : state === 'ready' ? (
                  <ModalNextButton
                    onClick={handleCommit}
                    label={
                      isSubmitting
                        ? 'Добавляем…'
                        : totalToAdd > 0
                          ? `Добавить ${totalToAdd}`
                          : 'Нечего добавлять'
                    }
                    variant="finish"
                    disabled={isSubmitting || totalToAdd === 0}
                  />
                ) : (
                  <ModalNextButton onClick={retry} label="Повторить" />
                )
              }
            />
          </ModalShell.Body>
        </ModalShell>
      }
    />
  );
};

function pluralizeItems(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'позиция';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'позиции';
  return 'позиций';
}

export default WriteFoodModal;
