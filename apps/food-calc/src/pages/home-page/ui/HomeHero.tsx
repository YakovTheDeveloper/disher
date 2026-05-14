import clsx from 'clsx';
import type { ScreenEntry } from '@/shared/ui/ScreenIndicator';
import s from './HomeHero.module.scss';

type Props = {
  screens: ScreenEntry[];
  activeIndex: number;
};

// Декоративная обложка для варианта `HomeNav=hero` (см. HomePage.tsx).
// На экран показывается пара image+title как единый блок, центрированный
// по обеим осям. Неактивные пары — opacity:0 + translateY, активная —
// opacity:1 + translateY:0. Слой неинтерактивен — клики/свайпы ловит
// Embla viewport сверху.
export const HomeHero = ({ screens, activeIndex }: Props) => {
  return (
    <div className={s.root} aria-hidden>
      {screens.map((screen, i) => (
        <div
          key={screen.label}
          className={clsx(s.layer, i === activeIndex && s.layerActive)}
        >
          {screen.image ? (
            <img src={screen.image} className={s.heroImg} alt="" />
          ) : null}
          <span className={s.heroTitle}>{screen.label}</span>
        </div>
      ))}
    </div>
  );
};

export default HomeHero;
