import type { CSSProperties } from 'react';
import { useWallpaperCrop, type WallpaperScreen } from '@/shared/lib/wallpaper';

/**
 * WallpaperImage — hero-обложка одного экрана. Тонкая обёртка над `<img>`, что
 * накладывает постоянный кроп (zoom+сдвиг) из `useWallpaperCrop` — наведённый
 * pinch/pan-жестом (WallpaperHero) пока открыт WallpaperDrawer. Трансформ едет
 * поверх cover-фита и маски-фейда обложки (те живут в scss каждого hero через
 * `className`); `.root` героя клипует по `overflow:hidden`, поэтому приближение
 * не оголяет края. `key={src}` на месте вызова даёт fade-in при смене обоев.
 */
export const WallpaperImage = ({
  screen,
  src,
  className,
}: {
  screen: WallpaperScreen;
  src: string;
  className?: string;
}) => {
  const { scale, x, y } = useWallpaperCrop(screen);
  const style = {
    transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
  } as CSSProperties;
  return <img src={src} className={className} style={style} alt="" />;
};

export default WallpaperImage;
