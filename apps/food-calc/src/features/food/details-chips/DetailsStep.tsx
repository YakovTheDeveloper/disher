import { DetailsChips } from './DetailsChips';
import type { ChipSurface } from '@/shared/ui/atoms/Chip';
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
  /** Surface-тир хоста (модалки), на котором лежат чипы. Дефолт 0 (бежевый стол). */
  surface?: ChipSurface;
};

export function DetailsStep({
  foodName,
  textareaId,
  value,
  onChange,
  productId,
  surface = 0,
}: Props) {
  const placeholder = 'Есть ли уточнения?';

  return (
    <div className={s.root}>
      <DetailsChips
        textareaId={textareaId}
        value={value}
        onChange={onChange}
        productId={productId}
        placeholder={placeholder}
        surface={surface}
      />
    </div>
  );
}

export default DetailsStep;
