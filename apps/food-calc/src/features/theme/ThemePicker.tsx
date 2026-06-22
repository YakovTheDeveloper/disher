import clsx from 'clsx';
import TickIcon from '@/shared/assets/icons/tick.svg?react';
import {
  USER_THEMES,
  USER_THEME_LABELS,
  useUserThemeStore,
  type UserTheme,
} from '@/shared/lib/user-theme';
import styles from './ThemePicker.module.scss';

const ThemePicker = () => {
  const theme = useUserThemeStore((s) => s.theme);
  const setTheme = useUserThemeStore((s) => s.setTheme);

  return (
    <div className={styles.grid} role="radiogroup" aria-label="Тема">
      {USER_THEMES.map((t: UserTheme) => {
        const isActive = t === theme;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={isActive}
            data-theme={t}
            className={clsx(styles.swatch, isActive && styles.active)}
            onClick={() => setTheme(t)}
          >
            <span className={styles.preview} aria-hidden />
            {/* Маркер «выбрано» = галочка справа-сверху в светлом бейдже (не кольцо/
                заливка — те дерутся с цветом самой темы). Бейдж держит контраст на
                тёмных свотчах (twilight). */}
            <span className={styles.tick} aria-hidden>
              <TickIcon />
            </span>
            <span className={styles.label}>{USER_THEME_LABELS[t]}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemePicker;
