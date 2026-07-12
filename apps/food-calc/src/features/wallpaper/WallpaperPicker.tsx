import { Text } from '@/shared/ui/atoms/Typography';
import { WALLPAPER_SCREENS } from '@/shared/lib/wallpaper';
import { WallpaperStrip } from './WallpaperStrip';
import styles from './WallpaperPicker.module.scss';

/**
 * WallpaperPicker — раздел настроек «Обои». Для КАЖДОГО экрана (Рацион / Блюдо /
 * События / Разборы) — подпись + `WallpaperStrip` (общий атом ленты, тот же, что
 * в long-press-поповере над обложкой). Выбор пишется в `useWallpaperStore` и сразу
 * читается hero-обложками. `bleed` возвращает ленте краевой инсет дровера, чтобы
 * она скроллилась от края до края.
 */
const WallpaperPicker = () => (
  <div className={styles.screens}>
    {WALLPAPER_SCREENS.map((screen) => (
      <div key={screen.key} className={styles.screenRow}>
        <Text as="span" role="caption" className={styles.screenLabel}>
          {screen.label}
        </Text>
        <WallpaperStrip screen={screen.key} layout="columns" className={styles.bleed} />
      </div>
    ))}
  </div>
);

export default WallpaperPicker;
