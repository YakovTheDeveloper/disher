import { useState, type ReactNode } from 'react';
import { QtyStack } from '@/shared/ui/atoms/QtyStack';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';

interface EditableQuantityProps {
  /** Authoritative quantity from the data layer (props/Dexie). */
  value: number;
  /** Unit label under the value — parent-supplied (getQtyUnit(product) vs «г»);
   *  компонент unit-агностичен. */
  unit: ReactNode;
  /** Вызывается на РЕАЛЬНОЕ изменение (draft !== value && > 0) при blur. */
  onCommit: (next: number) => void;
  /**
   * Opt-in: ставит `data-entity-edit` на стопку, чтобы Screen прятал свой нижний
   * бар, пока поле в фокусе (`Screen.module.scss :has([data-entity-edit]
   * :focus-within)`). По умолчанию ВЫКЛ — включать на поверхности без Screen-бара
   * (напр. предложка) = регрессия (бар начнёт прыгать). См. critique Slice 2.
   */
  dataEntityEdit?: boolean;
}

/**
 * EditableQuantity — простой инпут количества (QtyStack + NumberInput). Поле
 * ВСЕГДА отрендерено как инпут (без морфа текст↔поле); в покое читается как
 * текст — QtyStack.module.scss делает `.value input` прозрачным/безрамочным.
 * Коммитит в дата-слой на blur, если значение реально поменялось и > 0.
 *
 * Локальный `draft` обязателен: NumberInput ре-синкается на проп `value` на
 * КАЖДОМ рендере, поэтому кормим его НАШИМ draft (а не закоммиченным value) —
 * иначе набор отщёлкивало бы назад. Синк draft←value делаем render-time
 * (паттерн React «adjust state during render», НЕ эффект): авторитетное value
 * меняется снаружи — после коммита через useLiveQuery либо LWW-merge с другого
 * устройства. На раунд-трипе принят короткий показ старого значения (без
 * оптимизма — таков выбор «без переусложнений»).
 *
 * Файл экспортит только компонент (Fast Refresh — fastrefresh-screenindicator).
 */
export function EditableQuantity({
  value,
  unit,
  onCommit,
  dataEntityEdit,
}: EditableQuantityProps) {
  const [draft, setDraft] = useState(value);
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    setDraft(value);
  }

  const commit = () => {
    if (draft !== value && draft > 0) onCommit(draft);
  };

  return (
    <QtyStack
      unit={unit}
      mirror={String(draft)}
      data-entity-edit={dataEntityEdit || undefined}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.currentTarget.querySelector('input')?.blur(); // Enter → blur → commit
        } else if (e.key === 'Escape') {
          setDraft(value); // отмена набора
          e.currentTarget.querySelector('input')?.blur();
        }
      }}
    >
      <NumberInput value={draft} onChange={setDraft} onBlur={commit} maxLength={4} />
    </QtyStack>
  );
}

export default EditableQuantity;
