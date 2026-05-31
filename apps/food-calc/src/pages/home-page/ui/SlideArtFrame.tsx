import type { ReactNode } from 'react';
import s from './SlideArtFrame.module.scss';

type Props = {
  children: ReactNode;
};

// Per-slide центрирующий арт-слой для HomePage. Лежит ПОД контентом слайда
// (`z-index: -1` в собственном stacking-контексте `.frame`), поэтому
// проступает сквозь прозрачную обвязку и пустые (`hollow`) экраны.
// Единственная метка — очень бледное лого Disher по центру. Лого — белое PNG,
// красим через `mask` тёмным цветом (обычный <img> на светлой поверхности был
// бы невидим, тот же приём, что в FoodSchedule.weekdayHeading::after). День
// недели сюда НЕ кладём — он живёт в шапке FoodSchedule. `bandImg` в
// ScreenIndicator на HomePage подавлён (`bandImg={false}`), чтобы картинка таба
// не дублировала лого.
export const SlideArtFrame = ({ children }: Props) => {
  return (
    <div className={s.frame}>
      <div className={s.art} aria-hidden>
        <span className={s.logoArt} />
      </div>
      {children}
    </div>
  );
};

export default SlideArtFrame;
