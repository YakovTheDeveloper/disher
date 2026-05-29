import { DetailsChips } from './DetailsChips';
import s from './DetailsStep.module.scss';

/**
 * Шаг «Особенности» — открывается с уже поднятой клавиатурой, свёрстан плотно.
 * Свой заголовок не несёт: его даёт заголовок модалки (StepHeader / Header
 * с именем еды + ⓘ в trailing-слоте — см. ScheduleFoodEditModals).
 */
type Props = {
  /** Имя еды — используется только для персонализации плейсхолдера textarea
   *  («Особенности приема брокколи»). Само имя теперь рисуется в шапке модалки. */
  foodName?: string | null;
  textareaId: string;
  value: string;
  onChange: (next: string) => void;
  productId: string | null;
};

export function DetailsStep({ foodName, textareaId, value, onChange, productId }: Props) {
  const placeholder = foodName
    ? `Особенности приема ${foodName.toLowerCase()}`
    : 'Особенности приема, если есть';

  return (
    <div className={s.root}>
      <DetailsChips
        textareaId={textareaId}
        value={value}
        onChange={onChange}
        productId={productId}
        placeholder={placeholder}
      />
    </div>
  );
}

export default DetailsStep;
