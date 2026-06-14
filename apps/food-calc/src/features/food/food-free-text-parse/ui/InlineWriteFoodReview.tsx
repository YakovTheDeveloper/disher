import { useCallback, useState, type CSSProperties } from 'react';
import { createProduct } from '@/entities/product/api/mutations';
import { safeMutate } from '@/shared/lib/safeMutate';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { SheetCard } from '@/shared/ui/SheetCard';
import { PlusIcon } from '@/shared/ui/atoms/Button/PlusIcon';
import type { UseWriteFoodFlowResult, ReviewEditStep } from '../model/useWriteFoodFlow';
import { ProposalFoodItem } from './ProposalFoodItem';
import { FreeTextFoodReviewEditModals } from './FreeTextFoodReviewEditModals';
import { AddToListPopover } from './AddToListPopover';
import styles from './InlineWriteFoodReview.module.scss';

const REVIEW_INPUT_IDS = {
  // Уникальные id (отличаются от WriteFoodModal.REVIEW_INPUT_IDS) — на
  // FoodSchedule оба flow живут параллельно (writeFood + edit-schedule),
  // а модалка WriteFoodModal на этом экране теперь НЕ монтируется. Сохраняю
  // отдельные id чтобы не конфликтовать с DishBuilderPage если когда-нибудь
  // эти компоненты окажутся на одной странице.
  SEARCH_INPUT: 'inline-write-food-review-search',
  DETAILS_INPUT: 'inline-write-food-review-details',
} as const;

const INPUT_TO_STEP: Record<string, Exclude<ReviewEditStep, 'idle'>> = {
  [REVIEW_INPUT_IDS.SEARCH_INPUT]: 'search',
  [REVIEW_INPUT_IDS.DETAILS_INPUT]: 'details',
};

// Палитра под общий schedule-row look: белая/светло-серая заливка,
// нейтральный hairline outline, серый accent-stripe (без warm/coral
// по статусу). Семантика статуса остаётся в section-заголовках
// «Уточните» / «Не распознано».
const NEUTRAL_PALETTE: CSSProperties = {
  '--tod-bg-from': '#ffffff',
  '--tod-bg-to': '#f4f4f6',
  '--tod-outline-from': 'rgba(31, 42, 68, 0.08)',
  '--tod-outline-to': 'rgba(31, 42, 68, 0.06)',
  '--tod-tapped': 'rgba(31, 42, 68, 0.06)',
  '--accent-stripe': 'rgba(31, 42, 68, 0.18)',
} as CSSProperties;

interface RescueState {
  uid: string;
  anchor: HTMLElement;
  originalName: string;
}

export interface InlineWriteFoodReviewProps {
  flow: UseWriteFoodFlowResult;
}

export const InlineWriteFoodReview = ({ flow }: InlineWriteFoodReviewProps) => {
  const {
    state,
    inputText,
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
    cancel,
  } = flow;

  const [rescue, setRescue] = useState<RescueState | null>(null);

  const readyCount = resolved.length + ambiguous.length + unresolved.length;
  const isReviewEmpty = state === 'ready' && readyCount === 0;
  const showOriginalText = state === 'ready' && (ambiguous.length > 0 || unresolved.length > 0);

  // Auto-reset предложки на delete-to-empty живёт внутри useWriteFoodFlow
  // (через tap в scheduleUndoExpiry-timer). Здесь его НЕ дублируем — child
  // не должен «решать», когда сбрасывать flow.

  // Auto-scroll к предложке: триггерится прямо в AppBottomBar.handleSubmit
  // через requestAnimationFrame после flow.submit(). Здесь нет state-tracking
  // — просто помечаем root якорем `data-write-food-anchor`, по которому
  // querySelector в submit'е находит узел.

  // На focus event:
  // - target — `<input id=SEARCH_INPUT|DETAILS_INPUT>` через label-делегацию из
  //   ProposalFoodItem.FoodName или future details-editor.
  // - dataset.activeItemUid — uid ряда, выставлен в pointerdown (ScheduleFoodItem
  //   pattern). startEdit ВЫЗЫВАЕТСЯ здесь, а не в pointerdown — чтобы
  //   ModalByLabel не expand'ился между pointerdown и pointerup и не подставлял
  //   back-button SearchFood под click-координаты (это и был bug «open+close»).
  // - если ряд уже в editing-режиме (юзер переключается search ↔ details внутри
  //   модалки) → editingUid задан, нужен только setEditingStep.
  const handleReviewFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      const nextStep = INPUT_TO_STEP[target.id];
      if (!nextStep) return;
      if (editingUid) {
        setEditingStep(nextStep);
        return;
      }
      const uid = target.dataset.activeItemUid;
      if (!uid) return;
      startEdit(uid, nextStep);
    },
    [editingUid, setEditingStep, startEdit]
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
    [rescue, updateUnresolved]
  );

  const handleRescueCreateNew = useCallback(
    async (name: string) => {
      if (!rescue) return;
      const result = await safeMutate(() => createProduct({ name }), 'Не удалось создать продукт');
      if (!result.ok) return;
      updateUnresolved(rescue.uid, {
        manual: { id: result.value, name, score: 1 },
      });
      setRescue(null);
    },
    [rescue, updateUnresolved]
  );

  const isLoading = state === 'loading';
  if (state !== 'ready' && !isLoading) return null;

  if (isLoading) {
    return (
      <SheetCard
        key="wrap-loading"
        className={styles.reviewSheet}
        header="Распознаём…"
        data-state="loading"
        data-write-food-anchor=""
      >
        {inputText && <div className={styles.originalText}>{inputText}</div>}
        <div className={styles.skeleton} aria-live="polite" aria-busy="true">
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonSpinner}>
            <Spinner size={28} />
          </div>
        </div>
      </SheetCard>
    );
  }

  return (
    <SheetCard
      key="wrap-ready"
      className={styles.reviewSheet}
      header="Предложения"
      data-state="ready"
      data-write-food-anchor=""
      onFocusCapture={handleReviewFocusCapture}
      onAnimationEnd={(e) => {
        // Снимаем data-shake после завершения СОБСТВЕННОЙ анимации wrap'а,
        // чтобы следующий клик «Посмотреть варианты» давал чистый переход
        // absent→present — единственное, что надёжно перезапускает CSS-
        // анимацию во всех движках (re-add в том же тике после reflow
        // перезапуск НЕ гарантирует). Гард target===currentTarget отсекает
        // всплывшие animationend дочерних рядов.
        if (e.target === e.currentTarget) e.currentTarget.removeAttribute('data-shake');
      }}
      actions={
        // CTA-ряд: «Отменить» (fit-content, слева) чистит flow (cancel()) — это
        // теперь единственный способ закрыть предложку (× в шапке нет). «Добавить
        // N» (растягивается, справа) коммитит; задизейблена, когда добавлять
        // нечего (totalToAdd === 0) или во время сабмита.
        <>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => cancel()}
            disabled={isSubmitting}
          >
            Отменить
          </button>
          <button
            type="button"
            className={styles.commitBtn}
            onClick={() => void commit()}
            disabled={isSubmitting || totalToAdd === 0}
          >
            {isSubmitting ? 'Добавляем…' : `Добавить ${totalToAdd}`}
          </button>
        </>
      }
    >
      {showOriginalText && inputText && <div className={styles.originalText}>{inputText}</div>}

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
                  <li
                    key={r.uid}
                    className={styles.itemRow}
                    data-dismissed={r.enabled ? undefined : 'true'}
                  >
                    <ProposalFoodItem
                      uid={r.uid}
                      item={r}
                      hideTime={hideTime}
                      onCommitTime={(uid, time) => updateResolved(uid, { time })}
                      onCommitQuantity={(uid, quantity) => updateResolved(uid, { quantity })}
                      searchInputId={REVIEW_INPUT_IDS.SEARCH_INPUT}
                      paletteStyle={NEUTRAL_PALETTE}
                    />
                    <button
                      type="button"
                      className={styles.outerDelete}
                      onClick={() => toggleResolved(r.uid)}
                      aria-label={r.enabled ? 'Удалить' : 'Вернуть'}
                    >
                      <span className={styles.iconDismiss} aria-hidden="true">
                        ×
                      </span>
                      <span className={styles.iconUndo} aria-hidden="true">
                        ↶
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {ambiguous.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Уточните
                <span className={styles.sectionCount}>{ambiguous.length}</span>
              </h3>
              <ul className={styles.list}>
                {ambiguous.map((a) => {
                  const selected =
                    a.candidates.find((c) => c.id === a.selectedId) ?? a.candidates[0];
                  return (
                    <li
                      key={a.uid}
                      className={styles.itemRow}
                      data-dismissed={a.enabled ? undefined : 'true'}
                    >
                      <ProposalFoodItem
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
                        onSelectCandidate={(id) => updateAmbiguous(a.uid, { selectedId: id })}
                        onCommitTime={(uid, time) => updateAmbiguous(uid, { time })}
                        onCommitQuantity={(uid, quantity) => updateAmbiguous(uid, { quantity })}
                        searchInputId={REVIEW_INPUT_IDS.SEARCH_INPUT}
                        paletteStyle={NEUTRAL_PALETTE}
                      />
                      <button
                        type="button"
                        className={styles.outerDelete}
                        onClick={() => toggleAmbiguous(a.uid)}
                        aria-label={a.enabled ? 'Удалить' : 'Вернуть'}
                      >
                        <span className={styles.iconDismiss} aria-hidden="true">
                          ×
                        </span>
                        <span className={styles.iconUndo} aria-hidden="true">
                          ↶
                        </span>
                      </button>
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
                <span className={styles.sectionCount}>{unresolved.length}</span>
              </h3>
              <ul
                className={styles.list}
                data-rescue-slot={unresolved.some((u) => !u.manual) ? 'true' : undefined}
              >
                {unresolved.map((u) => (
                  <li
                    key={u.uid}
                    className={styles.itemRow}
                    data-dismissed={u.enabled ? undefined : 'true'}
                  >
                    {!u.manual && (
                      <button
                        type="button"
                        className={styles.outerRescue}
                        onClick={(e) =>
                          setRescue({
                            uid: u.uid,
                            anchor: e.currentTarget,
                            originalName: u.originalName,
                          })
                        }
                        aria-label="Добавить в свой список"
                        title="Добавить в свой список"
                      >
                        <PlusIcon />
                      </button>
                    )}
                    <ProposalFoodItem
                      uid={u.uid}
                      item={{
                        ...u,
                        name: u.manual?.name ?? u.originalName,
                        productId: u.manual?.id ?? '',
                      }}
                      hideTime={hideTime}
                      isUnresolved={!u.manual}
                      wasRescued={!!u.manual}
                      onCommitTime={(uid, time) => updateUnresolved(uid, { time })}
                      onCommitQuantity={(uid, quantity) => updateUnresolved(uid, { quantity })}
                      searchInputId={REVIEW_INPUT_IDS.SEARCH_INPUT}
                      paletteStyle={NEUTRAL_PALETTE}
                    />
                    <button
                      type="button"
                      className={styles.outerDelete}
                      onClick={() => toggleUnresolved(u.uid)}
                      aria-label={u.enabled ? 'Удалить' : 'Вернуть'}
                    >
                      <span className={styles.iconDismiss} aria-hidden="true">
                        ×
                      </span>
                      <span className={styles.iconUndo} aria-hidden="true">
                        ↶
                      </span>
                    </button>
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
    </SheetCard>
  );
};

export default InlineWriteFoodReview;
