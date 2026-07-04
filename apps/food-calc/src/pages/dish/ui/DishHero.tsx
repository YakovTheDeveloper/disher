import { memo } from 'react';
import { useWallpaperSrc } from '@/shared/lib/wallpaper';
import { WallpaperHero } from '@/features/wallpaper';
import s from './DishHero.module.scss';

// Гравюра-обложка конструктора блюда, над плитками-табами (паттерн AnalysesHero:
// одна статичная картинка + белый watermark Disher, маски упрощённого HomeHero).
// Картинку выбирает юзер — экран «Блюдо» в настройках («Обои») или долгий тап по
// самой обложке (WallpaperHero → поповер). `aria-hidden` + pointer-events:none
// (в scss) — свайпы по обложке ловит Embla ниже; интерактивна только зона жеста.
const DishHero = () => {
  const src = useWallpaperSrc('dish');

  return (
    <div className={s.root} aria-hidden>
      <img src={src} className={s.heroImg} alt="" />
      {/* Логотип Disher — белый masked-PNG, тот же ассет, что у Screen-watermark. */}
      <span className={s.logo} aria-hidden="true" />
      <WallpaperHero screen="dish" />
    </div>
  );
};

export default memo(DishHero);
