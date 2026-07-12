import { useCallback, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { createProduct } from '@/entities/product/api/mutations';
import { safeMutate } from '@/shared/lib/safeMutate';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { SheetCard } from '@/shared/ui/SheetCard';
import { drawerStore } from '@/shared/ui/drawer-store';
import { PlusIcon } from '@/shared/ui/atoms/icons/PlusIcon';
import type { UseWriteFoodFlowResult, ReviewEditStep } from '../model/useWriteFoodFlow';
import { ProposalFoodItem } from './ProposalFoodItem';
import { FreeTextFoodReviewEditModals } from './FreeTextFoodReviewEditModals';
import { AddToListPopover } from './AddToListPopover';
import { EmptyState } from '@/shared/ui/EmptyState';
import styles from './InlineWriteFoodReview.module.scss';
import { Heading, Text, Numeral } from '@/shared/ui/atoms/Typography';

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

// Палитра рядов предложки: ХОЛОДНАЯ бледная заливка через sys-токен
// (--sys-color-surface-proposal), БЕЗ рамки (--row-rest-outline-w: 0).
// Композиционно отстраивает машинно-сгенерированные ряды от тёплых
// committed-рядов расписания. Красим через канон --row-bg/--row-tapped
// (card-rim-okayomka), а не --tod-* градиент. Семантика статуса остаётся
// в section-заголовках «Уточните» / «Не распознано».
const PROPOSAL_PALETTE: CSSProperties = {
  '--row-bg': 'var(--sys-color-surface-proposal)',
  '--row-tapped': 'var(--sys-color-surface-proposal-pressed)',
  '--row-rest-outline-w': '0',
} as CSSProperties;

export interface InlineWriteFoodReviewProps {
  flow: UseWriteFoodFlowResult;
}

export const InlineWriteFoodReview = ({ flow }: InlineWriteFoodReviewProps) => {
  const { t } = useTranslation();
  const {
    targetKind,
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

  const readyCount = resolved.length + ambiguous.length + unresolved.length;
  const isReviewEmpty = state === 'ready' && readyCount === 0;
  const showOriginalText = state === 'ready' && (ambiguous.length > 0 || unresolved.length > 0);

  // Auto-reset предложки на delete-to-empty живёт внутри useWriteFoodFlow
  // (через tap в scheduleUndoExpiry-timer). Здесь его НЕ дублируем — child
  // не должен «решать», когда сбрасывать flow.

  // Предложка живёт внутри дока бара (слот bottomBar, над баром) — доскролл и
  // якоря больше не нужны (панель всегда на виду). Перенос из afterContent →
  // FoodWriteBar.dock по паттерну Событий, 2026-07-02.

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

  // «+» у нераспознанного ряда → bottom-sheet «Новый продукт» через drawerStore
  // (drawer-side-via-store). Anchor больше не нужен (теряется — ок, план Slice 12).
  // onCreateNew возвращает успех: drawer закрывается только если createProduct
  // прошёл (на провале остаётся открытым, тостер уже сообщил).
  const openRescueDrawer = useCallback(
    (uid: string, originalName: string) => {
      void drawerStore.show(
        AddToListPopover,
        {
          initialName: originalName,
          onUseExisting: (productId: string, name: string) =>
            updateUnresolved(uid, { manual: { id: productId, name, score: 1 } }),
          onCreateNew: async (name: string) => {
            const result = await safeMutate(
              () => createProduct({ name }),
              'Не удалось создать продукт'
            );
            if (!result.ok) return false;
            updateUnresolved(uid, { manual: { id: result.value, name, score: 1 } });
            return true;
          },
        },
        { side: 'bottom' }
      );
    },
    [updateUnresolved]
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
      >
        {inputText && (
          <Text as="p" role="caption" className={styles.originalText}>
            {inputText}
          </Text>
        )}
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
      // Заголовок «Предложения» переехал наверх — на место free-text-инпута в
      // баре (FoodWriteBar.readyHeader, 2026-07-02). Здесь его больше нет, иначе
      // задваивался бы (бар + шапка листка одна над другой).
      data-state="ready"
      onFocusCapture={handleReviewFocusCapture}
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
            <Text as="span" role="body">
              Отменить
            </Text>
          </button>
          <button
            type="button"
            className={styles.commitBtn}
            onClick={() => void commit()}
            disabled={isSubmitting || totalToAdd === 0}
          >
            <Text as="span" role="body">
              {isSubmitting ? 'Добавляем…' : `Добавить ${totalToAdd}`}
            </Text>
          </button>
        </>
      }
    >
      {showOriginalText && inputText && (
        <Text as="p" role="caption" className={styles.originalText}>
          {inputText}
        </Text>
      )}

      {isReviewEmpty ? (
        <EmptyState
          className={styles.empty}
          title={t('food.freeText.unrecognized.title')}
          description={t('food.freeText.unrecognized.description')}
        />
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
                      paletteStyle={PROPOSAL_PALETTE}
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
              <Heading as="h3" role="title" className={styles.sectionTitle}>
                Уточните
                <Numeral as="span" size="sm" weight="bold" className={styles.sectionCount}>
                  {ambiguous.length}
                </Numeral>
              </Heading>
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
                        paletteStyle={PROPOSAL_PALETTE}
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
              <Heading as="h3" role="title" className={styles.sectionTitle}>
                Не распознано
                <Numeral as="span" size="sm" weight="bold" className={styles.sectionCount}>
                  {unresolved.length}
                </Numeral>
              </Heading>
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
                        onClick={() => openRescueDrawer(u.uid, u.originalName)}
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
                      paletteStyle={PROPOSAL_PALETTE}
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
        excludeSupplements={targetKind === 'dish'}
      />
    </SheetCard>
  );
};

export default InlineWriteFoodReview;
