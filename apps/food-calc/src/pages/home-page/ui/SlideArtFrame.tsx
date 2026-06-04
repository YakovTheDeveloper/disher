import type { ReactNode } from 'react';
import s from './SlideArtFrame.module.scss';

type Props = {
  children: ReactNode;
};

// Per-slide flex-обёртка слайда HomePage. Бледный логотип Disher по центру
// больше НЕ живёт здесь — он переехал в Screen (`.brandWatermark`, единый для
// всех экранов, проявляется на пустом `hollow`-слайде). Обёртка осталась как
// flex-каркас, заполняющий слайд по высоте.
export const SlideArtFrame = ({ children }: Props) => {
  return <div className={s.frame}>{children}</div>;
};

export default SlideArtFrame;
