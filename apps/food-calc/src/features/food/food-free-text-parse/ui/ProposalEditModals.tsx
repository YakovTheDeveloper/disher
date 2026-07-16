import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { TimeChoose } from '@/shared/ui/TimeChoose';
import { ActionList } from '@/shared/ui/ActionList';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import {
  FoodEntryCreateModals,
  FOOD_ENTRY_STEP_LABELS,
  type FoodEntryFlow,
} from '@/features/food/food-entry-flow';

type Props = {
  /** Флоу предложки: useFoodEntryFlow({ mode: 'edit', target: { kind: 'proposal' } }). */
  flow: FoodEntryFlow;
};

/**
 * Модалки правки ряда ПРЕДЛОЖКИ. Своих у них два шага:
 *  • «Время» (ряд разбора несёт час приёма, у create-флоу его нет: там время =
 *    «сейчас» на коммите);
 *  • «Что поправить?» — хаб-чузер (тап по имени+особенностям ряда). Одна развилка
 *    на два намерения: «Поменять еду» → шаг поиска, «Поменять особенности» → шаг
 *    деталей. Прямой split-target (имя→поиск, детали→шаг) отвергнут из-за fat-
 *    finger между соседними строками — юзер выбрал хаб (V3, 2026-07-15).
 *
 * Всё остальное — поиск еды, «Новая еда», количество, детали — это буквально
 * `FoodEntryCreateModals`, тот же компонент, что рисует создание еды: ряд
 * предложки правит ТЕ ЖЕ экраны, а не их устаревшие копии.
 *
 * `position="fixed"`: предложка живёт в доке нижнего бара, absolute резолвился бы
 * против панели и уезжал бы вместе с её внутренним скроллом.
 */
export const ProposalEditModals = ({ flow }: Props) => {
  const {
    step,
    draft,
    editingItem,
    handleFocusCapture,
    handleTimeFinish,
    handleCommit,
    handleClose,
    inputIds: { TIME_INPUT, CHOOSE_INPUT, SEARCH_INPUT, DETAILS_INPUT },
  } = flow;

  // Хаб делает ДВА фокус-перехода: имя ряда → CHOOSE_INPUT, затем строка чузера →
  // SEARCH_INPUT/DETAILS_INPUT. Второй переход обязан пере-застолбить uid текущего
  // ряда в dataset целевого инпута — иначе handleEditFocusCapture (родитель)
  // перепраймит по СТАРОМУ uid, оставшемуся там от прошлого тапа по pending-ряду
  // (тот делегирует прямо в SEARCH_INPUT). Тот же stash-до-фокуса паттерн, что в ряду.
  const stashCurrent = (inputId: string) => () => {
    if (!editingItem) return;
    const el = document.getElementById(inputId);
    if (el) el.dataset.activeItemUid = editingItem.id;
  };

  return (
    <>
      <div onFocusCapture={handleFocusCapture}>
        {/* Хаб-чузер «Что поправить?» — вход правки имени/особенностей ряда. */}
        <ModalByLabel
          position="fixed"
          isExpanded={step === 'choose'}
          content={
            <ModalShell>
              <ModalShell.Header title={draft.foodName?.trim() || 'Правка'} onBack={handleClose} />
              <ModalShell.Body>
                {/* Невидимая цель фокус-делегации: тап по имени ряда (label
                    htmlFor=CHOOSE_INPUT) фокусит эту кнопку → onFocusCapture флипает
                    шаг на 'choose'. Кнопка, а не input — чтобы меню-шаг не поднимал
                    клавиатуру iOS. */}
                <button
                  id={CHOOSE_INPUT}
                  type="button"
                  aria-hidden="true"
                  tabIndex={-1}
                  style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                />
                {/* Ряды = <label htmlFor> шага-цели: фокус-делегация поднимает клаву
                    поиска/деталей на iOS (setStep из onClick этого бы не сделал). */}
                <ActionList>
                  <ActionList.Section as="h3" label="Что поправить?">
                    <SettingRow
                      label="Поменять еду"
                      htmlFor={SEARCH_INPUT}
                      onPointerDown={stashCurrent(SEARCH_INPUT)}
                      trailing={<ChevronGlyph />}
                    />
                    <SettingRow
                      label="Поменять особенности"
                      htmlFor={DETAILS_INPUT}
                      onPointerDown={stashCurrent(DETAILS_INPUT)}
                      trailing={<ChevronGlyph />}
                    />
                  </ActionList.Section>
                </ActionList>
              </ModalShell.Body>
            </ModalShell>
          }
        />

        <ModalByLabel
          position="fixed"
          isExpanded={step === 'time'}
          content={
            <ModalShell>
              <ModalShell.Header title={FOOD_ENTRY_STEP_LABELS.time} onBack={handleClose} />
              <ModalShell.Body>
                <TimeChoose
                  onFinish={handleTimeFinish}
                  initialTime={draft.time}
                  inputId={TIME_INPUT}
                />
                <ModalShell.ActionButtons
                  right={<ModalNextButton onClick={handleCommit} variant="finish" />}
                />
              </ModalShell.Body>
            </ModalShell>
          }
        />
      </div>

      <FoodEntryCreateModals flow={flow} position="fixed" />
    </>
  );
};

export default ProposalEditModals;
