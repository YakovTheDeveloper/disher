import { FC, useCallback } from 'react';
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
   * Передавай явный текст из модалки создания еды/добавки, где контекст
   * («еда vs БАД») известен на момент рендера.
   */
  hint?: string;
  /**
   * Derived non-editable row pinned to the top of the list (e.g. for Dish:
   * `{ label: 'Всё блюдо', grams: Σ dish_items.quantity }`). Always recomputed
   * by the parent — never persisted; bypassing the empty-state.
   */
  implicitPortion?: Portion;
  onAdd?: (portion: Portion) => void;
  onUpdate?: (label: string, updates: Partial<Portion>) => void;
  onRemove?: (label: string) => void;
  /**
   * Default `true`. Set to `false` on screens that move the "Add portion"
   * affordance to a page-level bottom bar (ProductPage / DishBuilderPage
   * «Порции»-slide). The widget then only renders the list itself.
   */
  showAddButton?: boolean;
  /**
   * Default `true`. Set to `false` on the «Порции»-slide of ProductPage /
   * DishBuilderPage, which floats the hint as an absolute caption under the
   * screen title instead.
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

const DEFAULT_LABEL_BASE = 'моя порция';

// Exported: ProductPage / DishBuilderPage call this from the page-level
// bottom-bar «Добавить порцию» button to pre-compute the next free label
// without rebuilding the helper.
export function nextDefaultPortionLabel(existing: Portion[]): string {
  const labels = new Set(existing.map((p) => p.label));
  if (!labels.has(DEFAULT_LABEL_BASE)) return DEFAULT_LABEL_BASE;
  let n = 2;
  while (labels.has(`${DEFAULT_LABEL_BASE} ${n}`)) n += 1;
  return `${DEFAULT_LABEL_BASE} ${n}`;
}

const FoodPortionsManager: FC<Props> = ({
  portions,
  unit = 'г',
  hint,
  implicitPortion,
  onAdd,
  onUpdate,
  onRemove,
  showAddButton = true,
  showHint = true,
}) => {
  const editable = !!(onAdd && onUpdate && onRemove);
  const hintText = hint ?? defaultHint(unit);

  const handleAdd = useCallback(() => {
    onAdd?.({ label: nextDefaultPortionLabel(portions), grams: 0 });
  }, [portions, onAdd]);

  // Nothing to render: no portions, no derived/implicit row, hint suppressed,
  // and the add-affordance lives elsewhere (page-level bottom bar). Skip the
  // container entirely so the screen doesn't show an empty padded box.
  const hasNothingToShow =
    portions.length === 0 &&
    !implicitPortion &&
    !(editable && showHint) &&
    !(editable && showAddButton);
  if (hasNothingToShow) return null;

  // Label is the row key — collisions break React reconciliation. На blur
  // откатываем пустые/дублирующие значения визуально, в state не уходим.
  const handleLabelBlur =
    (originalLabel: string) => (e: React.FocusEvent<HTMLInputElement>) => {
      const next = e.target.value.trim();
      if (!next || next === originalLabel) {
        e.target.value = originalLabel;
        return;
      }
      const collision = portions.some(
        (p) => p.label !== originalLabel && p.label === next,
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
            <div key={p.label} className={s.portionEdit}>
              <input
                className={s.formInput}
                defaultValue={p.label}
                placeholder="название"
                onBlur={handleLabelBlur(p.label)}
              />
              <input
                className={s.formInputGrams}
                defaultValue={p.grams || ''}
                placeholder={GRAM_UNITS.has(unit) ? 'вес, г' : unit}
                inputMode="numeric"
                onBlur={handleGramsBlur(p.label, p.grams)}
              />
              <span className={s.portionUnitSuffix}>{unit}</span>
              <button
                type="button"
                className={s.iconButton}
                onClick={() => onRemove?.(p.label)}
                aria-label="Удалить порцию"
              >
                ×
              </button>
            </div>
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

      {editable && showAddButton && (
        <button type="button" className={s.addButton} onClick={handleAdd}>
          + добавить порцию
        </button>
      )}
    </div>
  );
};

export default FoodPortionsManager;
