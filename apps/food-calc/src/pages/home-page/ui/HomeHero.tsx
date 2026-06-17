import { useState } from 'react';
import s from './HomeHero.module.scss';

// Наборы обложек по слайдам (картинки лежат в public/art/hero). Первый в каждом
// наборе = дефолт экрана; клик по обложке циклически перебирает остальные
// «подходящие» — это тест-переключатель, чтобы юзер выбрал финальную.
//   slide 0 — Открытия: наблюдение / изучение / гипотезы
//   slide 1 — Рацион:   еда / урожай / плоды
//   slide 2 — События:  люди / активность / отдых / время
const HERO_SETS: string[][] = [
  // Открытия
  [
    '/art/hero/NPG-AD_NPG_83_2BradysPhotoGallery-000001_screen.jpg', // галерея портретов — «стена наблюдений»
    '/art/hero/CHSDM-D24E5D6646192-000001_screen.jpg', // две антилопы зеркально — гипотеза/баланс
    '/art/hero/hero-art-1.png', // крепость-гравюра (прежний дефолт)
    '/art/hero/CHSDM-B9FC4D1302062-000001_screen.jpg', // городская площадь — жизнь под наблюдением
  ],
  // Рацион
  [
    '/art/hero/SAAM-1977.99.2_2_screen.jpg', // «OCTOBER» — виноград, урожай
    '/art/hero/NZP-20181114-3807SB_screen.jpg', // лемур + тыква с фруктами и капустой
    '/art/hero/CHSDM-23644_02-000001_screen.jpg', // осенний лес, тёплая листва
  ],
  // События
  [
    '/art/hero/SAAM-1996.63.168_1_screen.jpg', // «High Tide» (Хомер) — люди на берегу
    '/art/hero/SAAM-1996.63.170_1_screen.jpg', // «The Robin's Note» (Хомер) — гамак, отдых
    '/art/hero/hero-events.jpg', // пальмы, руины, закат — атмосфера времени
    '/art/hero/CHSDM-259998D64EE22-000001_screen.jpg', // сцена с флейтой (Гамлет) — действие
    '/art/hero/hero-events-2.jpg', // вышивка-сэмплер — folk
  ],
];

/**
 * HomeHero — декоративная обложка НАД табами. У каждого слайда (slide=0/1/2)
 * свой набор «подходящих» картинок; первая = дефолт. Клик по обложке
 * перелистывает набор с crossfade'ом (тест-переключатель — юзер ищет финальную).
 *
 * Появляется только в NavSwitcher-варианте `tray-pill-bleed-hero` (gate по
 * `data-dv-v` на `.swipeArea`-предке живёт в HomeHero.module.scss; в остальных
 * вариантах `.root` = display:none, место не занимает).
 *
 * z-index НИЖЕ контент-листа (`.headerOverlap`) — лист всегда поверх обложки.
 * Кликабельна только сама обложка (`.hit`); `.root` остаётся pointer-events:none,
 * чтобы свайпы по краям ловил Embla ниже.
 */
export const HomeHero = ({ slide = 0 }: { slide?: number }) => {
  const candidates = HERO_SETS[slide] ?? HERO_SETS[0];
  const [idx, setIdx] = useState(0);
  // Уходящая картинка — рисуется под текущей и угасает (crossfade).
  const [prevIdx, setPrevIdx] = useState<number | null>(null);

  const cycle = () => {
    setPrevIdx(idx);
    setIdx((i) => (i + 1) % candidates.length);
  };

  return (
    <div className={s.root} aria-hidden>
      <button type="button" className={s.hit} onClick={cycle} aria-label="Сменить обложку">
        {prevIdx !== null && (
          <img
            key={`prev-${prevIdx}`}
            src={candidates[prevIdx]}
            className={`${s.heroImg} ${s.fadeOut}`}
            alt=""
          />
        )}
        <img
          key={`cur-${idx}`}
          src={candidates[idx]}
          className={`${s.heroImg} ${s.fadeIn}`}
          alt=""
        />
        {/* Логотип Disher — белый, по центру сверху над картинкой (masked PNG,
            тот же ассет, что у Screen-watermark, но full-opacity и белый). */}
        <span className={s.logo} aria-hidden="true" />
      </button>
    </div>
  );
};

export default HomeHero;
