import { memo } from 'react';
import { FabricLoader } from '@/features/analysis/FabricLoader';
import { formatWindowLabel } from '@/features/analysis/long';
import { useWallpaperSrc } from '@/shared/lib/wallpaper';
import { WallpaperHero } from '@/features/wallpaper';
import { useAnalysesFeedContext } from '../model/AnalysesFeedContext';
import s from './AnalysesHero.module.scss';

// Гравюра-обложка среднего экрана /analyses (Разборы), над плитками-табами. Пока
// нет идущих разборов — статичная гравюра + белый водяной знак Disher (паттерн
// HomeHero). Картинку выбирает юзер в настройках («Обои», экран «Разборы») —
// читаем из `useWallpaperSrc`. Как только появляется pending — обложка уступает
// место `FabricLoader` с меткой самого свежего периода и «и ещё N» для остальных.
// Данные — из feed-контекста (тот же инстанс, что кормит список), поэтому
// `heroForSlide` в SwipeDeck остаётся стабильным. `aria-hidden` +
// pointer-events:none (в scss) — свайпы по обложке ловит Embla ниже.

const AnalysesHero = () => {
  const { pending } = useAnalysesFeedContext();
  const heroArt = useWallpaperSrc('analyses');

  if (pending.length > 0) {
    const top = pending[0];
    const rest = pending.length - 1;
    const caption =
      formatWindowLabel(top.windowStart, top.windowEnd) +
      (rest > 0 ? ` · и ещё ${rest}` : '');
    return (
      <div className={s.loaderWrap}>
        <FabricLoader art="/art/loader-analysis.png" caption={caption} effect="scan" />
      </div>
    );
  }

  return (
    <div className={s.root} aria-hidden>
      <img src={heroArt} className={s.heroImg} alt="" />
      {/* Логотип Disher — белый masked-PNG, тот же ассет, что у Screen-watermark. */}
      <span className={s.logo} aria-hidden="true" />
      <WallpaperHero screen="analyses" />
    </div>
  );
};

export default memo(AnalysesHero);
