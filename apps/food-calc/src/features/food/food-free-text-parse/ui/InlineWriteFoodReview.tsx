import { useCallback, useMemo, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { SheetCard } from '@/shared/ui/SheetCard';
import { PlusIcon } from '@/shared/ui/atoms/icons/PlusIcon';
import { IconButton } from '@/shared/ui/atoms/Button';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import { useFoodEntryFlow, type ProposalEditItem } from '@/features/food/food-entry-flow';
import type { UseWriteFoodFlowResult, UnresolvedRow } from '../model/useWriteFoodFlow';
import { ProposalFoodItem } from './ProposalFoodItem';
import { ProposalEditModals } from './ProposalEditModals';
import { EmptyState } from '@/shared/ui/EmptyState';
import styles from './InlineWriteFoodReview.module.scss';
import { Heading, Text, Numeral } from '@/shared/ui/atoms/Typography';

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

// Крестик ряда = тот же примитив IconButton, что крест дроверов; «голый» shell
// (без tone) — вид несёт .outerDelete. Это НЕ удаление, а soft-delete/undo:
// на погашенном ряду глиф меняется на «вернуть» (свич живёт в scss по
// [data-dismissed], оба глифа смонтированы).
const DismissButton = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
  <IconButton
    className={styles.outerDelete}
    aria-label={enabled ? 'Удалить' : 'Вернуть'}
    onClick={onClick}
    icon={
      <span className={styles.dismissGlyphs}>
        <span className={styles.iconDismiss} aria-hidden="true">
          <CrossIcon width={16} height={16} />
        </span>
        <span className={styles.iconUndo} aria-hidden="true">
          ↶
        </span>
      </span>
    }
  />
);

export const InlineWriteFoodReview = ({ flow }: InlineWriteFoodReviewProps) => {
  const { t } = useTranslation();
  const {
    targetKind,
    state,
    resolved,
    ambiguous,
    unresolved,
    hideTime,
    totalToAdd,
    isSubmitting,
    toggleResolved,
    toggleAmbiguous,
    toggleUnresolved,
    updateRow,
    commit,
    cancel,
  } = flow;

  // Правка ряда предложки = ТОТ ЖЕ флоу еды, что правит расписание и блюдо
  // (те же шаги, те же модалки), только entity-write подменён колбэком: патч
  // уезжает в in-memory ряд, а в базу всё уедет общим «Подтвердить».
  const proposalTarget = useMemo(
    () => ({ kind: 'proposal' as const, host: targetKind, onCommit: updateRow }),
    [targetKind, updateRow]
  );
  const editFlow = useFoodEntryFlow({ mode: 'edit', target: proposalTarget });
  const editIds = editFlow.inputIds;
  const primeEdit = editFlow.primeEdit;

  // Ряд в терминах флоу: ручной выбор (choice) перебивает то, что подобрал матчер.
  const toEditItem = useCallback(
    (uid: string): ProposalEditItem | null => {
      const row =
        resolved.find((r) => r.uid === uid) ??
        ambiguous.find((a) => a.uid === uid) ??
        unresolved.find((u) => u.uid === uid);
      if (!row) return null;

      const matcherId =
        'productId' in row
          ? row.productId
          : 'selectedId' in row
            ? row.selectedId
            : (row.manual?.id ?? null);

      // Имя, которое РЯД показывает (не только ручной выбор): нужно заголовку
      // хаб-чузера. Зеркалит per-section формулу отображения имени в рендере ниже.
      const displayName =
        row.choice?.name ??
        ('productId' in row
          ? row.name
          : 'selectedId' in row
            ? (row.candidates.find((c) => c.id === row.selectedId)?.name ?? null)
            : (row.manual?.name ?? row.originalName));

      return {
        id: row.uid,
        time: row.time,
        quantity: row.quantity,
        details: row.details,
        variant: row.choice?.variant ?? 'product',
        productId: row.choice ? row.choice.productId : matcherId,
        dishId: row.choice?.dishId ?? null,
        foodName: displayName,
      };
    },
    [resolved, ambiguous, unresolved]
  );

  // Ряд шлёт свой uid в dataset инпута шага на pointerdown (см. ProposalFoodItem);
  // здесь, на focus-событии, праймим им флоу. Шаг флоу флипнет свой собственный
  // onFocusCapture (внутри ProposalEditModals) — на этом же событии, но ПОЗЖЕ:
  // capture идёт снаружи внутрь. Синхронный setStep тут сломал бы label-делегацию.
  const handleEditFocusCapture = useCallback(
    (e: React.FocusEvent) => {
      const target = e.target as HTMLElement;
      const uid = target.dataset.activeItemUid;
      if (!uid) return;
      const item = toEditItem(uid);
      if (item) primeEdit(item);
    },
    [primeEdit, toEditItem]
  );

  // «+» у нераспознанного ряда → шаг «Создать еду» ТОГО ЖЕ флоу правки (ModalByLabel,
  // один инстанс на всю предложку), а НЕ поиск: тап по имени ряда уже ведёт в поиск,
  // и «+» несёт другое намерение — «такой еды нет, заведи». Свой drawer-дубль
  // «Новый продукт» снят. Имя преднаполнять не нужно: primeEdit кладёт в draft
  // foodName = originalName ряда, а шаг создания синкает createName из него.
  //
  // Stash uid на pointerdown, БЕЗ state update — тот же паттерн, что в
  // ProposalFoodItem: setState здесь раскрыл бы ModalByLabel между pointerdown и
  // pointerup, и native click приземлился бы по координатам на «назад» раскрытой
  // модалки. Праймит флоу родительский onFocusCapture, уже на focus-событии.
  const stashRescueUid = useCallback(
    (uid: string) => () => {
      const trigger = document.getElementById(editIds.CREATE_INPUT);
      if (trigger) trigger.dataset.activeItemUid = uid;
    },
    [editIds.CREATE_INPUT]
  );

  const readyCount = resolved.length + ambiguous.length + unresolved.length;
  const isReviewEmpty = state === 'ready' && readyCount === 0;

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

  const section = (title: string, count: number, children: ReactNode) => (
    <section className={styles.section}>
      <Heading as="h3" role="title" className={styles.sectionTitle}>
        {title}
        <Numeral as="span" size="sm" weight="bold" className={styles.sectionCount}>
          {count}
        </Numeral>
      </Heading>
      {children}
    </section>
  );

  // Как только юзер подобрал/создал еду взамен нераспознанной (choice/manual несёт
  // имя), ряд перестаёт быть «не распознано» и переезжает в основную секцию — тот
  // же паттерн, что resolved. Пустой rescue-«+» и italic-fallback остаются только
  // у ещё-нераспознанных (pending).
  const isRescued = (u: UnresolvedRow) => !!(u.choice?.name || u.manual?.name);
  const unresolvedPicked = unresolved.filter(isRescued);
  const unresolvedPending = unresolved.filter((u) => !isRescued(u));

  const renderUnresolvedRow = (u: UnresolvedRow) => {
    const picked = u.choice?.name || u.manual?.name || '';
    return (
      <li key={u.uid} className={styles.itemRow} data-dismissed={u.enabled ? undefined : 'true'}>
        {!picked && (
          <label
            className={styles.outerRescue}
            htmlFor={editIds.CREATE_INPUT}
            onPointerDown={stashRescueUid(u.uid)}
            aria-label="Создать еду"
            title="Создать еду"
          >
            <PlusIcon />
          </label>
        )}
        <ProposalFoodItem
          uid={u.uid}
          item={{
            ...u,
            name: picked || u.originalName,
            productId: u.choice ? (u.choice.productId ?? '') : (u.manual?.id ?? ''),
          }}
          hideTime={hideTime}
          isUnresolved={!picked}
          inputIds={editIds}
          paletteStyle={PROPOSAL_PALETTE}
        />
        <DismissButton enabled={u.enabled} onClick={() => toggleUnresolved(u.uid)} />
      </li>
    );
  };

  return (
    <SheetCard
      key="wrap-ready"
      className={styles.reviewSheet}
      // Заголовок «Предложения» переехал наверх — на место free-text-инпута в
      // баре (FoodWriteBar.readyHeader, 2026-07-02). Здесь его больше нет, иначе
      // задваивался бы (бар + шапка листка одна над другой).
      data-state="ready"
      actions={
        // CTA-ряд: «Отменить» (fit-content, слева) чистит flow (cancel()) — это
        // единственный способ закрыть предложку (× в шапке нет). «Подтвердить»
        // (растягивается, справа) коммитит; задизейблена, когда добавлять нечего
        // (totalToAdd === 0) или во время сабмита.
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
              {isSubmitting ? 'Добавляем…' : 'Подтвердить'}
            </Text>
          </button>
        </>
      }
    >
      {isReviewEmpty ? (
        <EmptyState
          className={styles.empty}
          title={t('food.freeText.unrecognized.title')}
          description={t('food.freeText.unrecognized.description')}
        />
      ) : (
        <div className={styles.sections}>
          {(resolved.length > 0 || unresolvedPicked.length > 0) && (
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
                      item={{
                        ...r,
                        name: r.choice?.name || r.name,
                        productId: r.choice ? (r.choice.productId ?? '') : r.productId,
                      }}
                      hideTime={hideTime}
                      inputIds={editIds}
                      paletteStyle={PROPOSAL_PALETTE}
                    />
                    <DismissButton enabled={r.enabled} onClick={() => toggleResolved(r.uid)} />
                  </li>
                ))}
                {/* Нераспознанные, которым юзер уже подобрал еду, — здесь, среди
                    основных (переезд из «Не распознано»). */}
                {unresolvedPicked.map(renderUnresolvedRow)}
              </ul>
            </section>
          )}

          {ambiguous.length > 0 &&
            section(
              'Уточните',
              ambiguous.length,
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
                          name: a.choice?.name || selected?.name || '—',
                          productId: a.choice
                            ? (a.choice.productId ?? '')
                            : (a.selectedId ?? ''),
                        }}
                        hideTime={hideTime}
                        inputIds={editIds}
                        paletteStyle={PROPOSAL_PALETTE}
                      />
                      <DismissButton enabled={a.enabled} onClick={() => toggleAmbiguous(a.uid)} />
                    </li>
                  );
                })}
              </ul>
            )}

          {unresolvedPending.length > 0 &&
            section(
              'Не распознано',
              unresolvedPending.length,
              <ul className={styles.list} data-rescue-slot="true">
                {unresolvedPending.map(renderUnresolvedRow)}
              </ul>
            )}
        </div>
      )}

      {/* Праймим флоу uid'ом ряда на focus-событии (см. handleEditFocusCapture);
          шаг флипает уже сам флоу — внутри ProposalEditModals. */}
      <div onFocusCapture={handleEditFocusCapture}>
        <ProposalEditModals flow={editFlow} />
      </div>
    </SheetCard>
  );
};

export default InlineWriteFoodReview;
