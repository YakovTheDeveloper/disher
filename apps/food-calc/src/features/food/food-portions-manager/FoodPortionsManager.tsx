import { FC, useState } from 'react';
import { useLongPress } from '@/shared/lib/hooks/useLongPress';
import s from './FoodPortionsManager.module.scss';

type Portion = { label: string; grams: number };

type Props = {
  portions: Portion[];
  /**
   * Единица измерения порции — `'г'` для еды, `servingUnit` для добавок
   * (IU / mg / mcg / g / шт). Используется в placeholder инпута и в
   * suffix-подписи рядом с числом.
   */
  unit?: string;
  /**
   * Подсказка над виджетом — объясняет юзеру, что хранят порции в его
   * контексте. Если не задана, виджет покажет дефолт по `unit`.
   */
  hint?: string;
  /**
   * Derived non-editable row pinned to the top of the list (e.g. for Dish:
   * `{ label: 'Всё блюдо', grams: Σ dish_items.quantity }`). Always recomputed
   * by the parent — never persisted, never deletable.
   */
  implicitPortion?: Portion;
  /** Inline-правка существующей порции (label / grams). Наличие = editable-режим. */
  onUpdate?: (label: string, updates: Partial<Portion>) => void;
  /**
   * Long-press по строке-порции → страница открывает drawer подтверждения
   * удаления (`ItemActionsDrawer`). Создание и удаление вынесены из виджета:
   * виджет рисует список + inline-правку, а add/delete живут на странице
   * (модалка создания + long-press-drawer). Если не задан — long-press off.
   */
  onLongPressRow?: (label: string) => void;
  /**
   * Default `true`. На «Порции»-слайде Product/Dish hint вынесен в caption под
   * заголовком, поэтому страницы передают `false`.
   */
  showHint?: boolean;
};

const GRAM_UNITS = new Set(['г', 'g', 'G']);

function defaultHint(unit: string): string {
  if (GRAM_UNITS.has(unit)) {
    return 'Порции — твои часто-используемые веса. Например, «миска» = 250 г.';
  }
  return `Порции — твои дозы. Например, «утренняя» = 1 ${unit}.`;
}

type EditRowProps = {
  portion: Portion;
  unit: string;
  isGramUnit: boolean;
  onLabelCommit: (e: React.FocusEvent<HTMLInputElement>) => void;
  onGramsCommit: (e: React.FocusEvent<HTMLInputElement>) => void;
  onLongPress?: () => void;
};

// Канон HomePage (ScheduleFoodItemInline): в ПОКОЕ ячейки — тап-таргеты (span),
// сырой <input> появляется ТОЛЬКО в режиме правки (тап → input autoFocus → blur
// коммитит). Поэтому в покое инпутов нет, и long-press по pill'у не конфликтует
// с удержанием каретки. useLongPress навешен прямо на sky-pill (без обёртки
// LongPressRow, которая красила бы свой tod-фон поверх sky-градиента —
// «один владелец bg», см. drawer-layout-canon).
const PortionEditRow = ({
  portion,
  unit,
  isGramUnit,
  onLabelCommit,
  onGramsCommit,
  onLongPress,
}: EditRowProps) => {
  const longPress = useLongPress(onLongPress ?? (() => {}));
  const pressHandlers = onLongPress ? longPress : {};
  const [editing, setEditing] = useState<null | 'label' | 'grams'>(null);

  const finishLabel = (e: React.FocusEvent<HTMLInputElement>) => {
    onLabelCommit(e);
    setEditing(null);
  };
  const finishGrams = (e: React.FocusEvent<HTMLInputElement>) => {
    onGramsCommit(e);
    setEditing(null);
  };

  return (
    <div className={s.portionEdit} {...pressHandlers}>
      {editing === 'label' ? (
        <input
          className={s.formInput}
          defaultValue={portion.label}
          placeholder="название"
          autoFocus
          onBlur={finishLabel}
        />
      ) : (
        <span className={s.cellLabel} onClick={() => setEditing('label')}>
          {portion.label}
        </span>
      )}

      {editing === 'grams' ? (
        <input
          className={s.formInputGrams}
          defaultValue={portion.grams || ''}
          placeholder={isGramUnit ? 'вес, г' : unit}
          inputMode="numeric"
          autoFocus
          onBlur={finishGrams}
        />
      ) : (
        <span className={s.cellGrams} onClick={() => setEditing('grams')}>
          {portion.grams || '—'}
        </span>
      )}

      <span className={s.portionUnitSuffix}>{unit}</span>
    </div>
  );
};

const FoodPortionsManager: FC<Props> = ({
  portions,
  unit = 'г',
  hint,
  implicitPortion,
  onUpdate,
  onLongPressRow,
  showHint = true,
}) => {
  const editable = !!onUpdate;
  const hintText = hint ?? defaultHint(unit);
  const isGramUnit = GRAM_UNITS.has(unit);

  // Nothing to render: no portions, no derived/implicit row, hint suppressed.
  // Add-affordance живёт на странице (нижний бар), так что пустой editable-экран
  // отдаём наверх пустым — Screen покажет hollow-watermark.
  const hasNothingToShow =
    portions.length === 0 && !implicitPortion && !(editable && showHint);
  if (hasNothingToShow) return null;

  // Label is the row key — collisions break React reconciliation. На blur
  // откатываем пустые/дублирующие значения визуально, в state не уходим.
  // Сравнение дублей — case-insensitive (единообразно с usePortionFlow.isDuplicate).
  const handleLabelBlur =
    (originalLabel: string) => (e: React.FocusEvent<HTMLInputElement>) => {
      const next = e.target.value.trim();
      if (!next || next === originalLabel) {
        e.target.value = originalLabel;
        return;
      }
      const nextLower = next.toLowerCase();
      const collision = portions.some(
        (p) => p.label !== originalLabel && p.label.toLowerCase() === nextLower,
      );
      if (collision) {
        e.target.value = originalLabel;
        return;
      }
      onUpdate?.(originalLabel, { label: next });
    };

  const handleGramsBlur =
    (originalLabel: string, prevGrams: number) =>
    (e: React.FocusEvent<HTMLInputElement>) => {
      const sanitized = e.target.value.replace(/[^0-9]/g, '');
      const next = sanitized ? parseInt(sanitized, 10) : 0;
      if (next === prevGrams) {
        e.target.value = next ? String(next) : '';
        return;
      }
      onUpdate?.(originalLabel, { grams: next });
    };

  return (
    <div className={s.container}>
      {editable && showHint && <p className={s.hint}>{hintText}</p>}

      {portions.length === 0 && !implicitPortion && !editable && (
        <div className={s.empty}>нет порций</div>
      )}

      <div className={s.list}>
        {implicitPortion && (
          <div className={s.portion}>
            <div className={s.portionInfo}>
              <span className={s.portionLabel}>{implicitPortion.label}</span>
              <span className={s.portionGrams}>
                {implicitPortion.grams} {unit}
              </span>
            </div>
          </div>
        )}

        {portions.map((p) =>
          editable ? (
            <PortionEditRow
              key={p.label}
              portion={p}
              unit={unit}
              isGramUnit={isGramUnit}
              onLabelCommit={handleLabelBlur(p.label)}
              onGramsCommit={handleGramsBlur(p.label, p.grams)}
              onLongPress={onLongPressRow ? () => onLongPressRow(p.label) : undefined}
            />
          ) : (
            <div key={p.label} className={s.portion}>
              <div className={s.portionInfo}>
                <span className={s.portionLabel}>{p.label}</span>
                <span className={s.portionGrams}>
                  {p.grams} {unit}
                </span>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default FoodPortionsManager;
