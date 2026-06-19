import type { ReactNode } from 'react';
import s from './SlideArtFrame.module.scss';

type Props = {
  children: ReactNode;
};

// Per-slide flex-обёртка слайда HomePage. Бренд-знак Disher теперь рисует сам
// Screen-лист (`.headerOverlap::after`, маленький знак справа-сверху). Обёртка
// осталась как flex-каркас, заполняющий слайд по высоте.
export const SlideArtFrame = ({ children }: Props) => {
  return <div className={s.frame}>{children}</div>;
};

export default SlideArtFrame;
