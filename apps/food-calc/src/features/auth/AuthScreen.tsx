import { useDesignVariants } from '@/shared/lib/useDesignVariants';
import { shouldShowDvBar } from '@/app/ui/DesignVariantsBar';
import { AuthForm } from './AuthForm';
import styles from './AuthScreen.module.scss';

type Variant = 'v1-photo' | 'v2-yandex' | 'v3-yandex-bg1' | 'v4-yandex-bg2';

const VARIANTS: readonly Variant[] = [
  'v1-photo',
  'v2-yandex',
  'v3-yandex-bg1',
  'v4-yandex-bg2',
] as const;

const THEME_BY_VARIANT: Record<Variant, string> = {
  'v1-photo': 'dark',
  'v2-yandex': 'yandex-light',
  'v3-yandex-bg1': 'yandex-photo',
  'v4-yandex-bg2': 'yandex-photo',
};

const HAS_BG: Record<Variant, boolean> = {
  'v1-photo': true,
  'v2-yandex': false,
  'v3-yandex-bg1': true,
  'v4-yandex-bg2': true,
};

/**
 * Fullscreen auth blocker. Mounted by AuthGate when there is no session.
 * On success the auth-store flips isLoggedIn → true and the gate unmounts.
 */
export function AuthScreen() {
  const showDv = shouldShowDvBar();
  const { index } = useDesignVariants('AuthScreen', VARIANTS.length);
  const variant: Variant = showDv ? VARIANTS[index] : VARIANTS[0];
  const theme = THEME_BY_VARIANT[variant];
  const hasBg = HAS_BG[variant];

  return (
    <div className={styles.screen} data-auth-variant={variant} data-auth-theme={theme}>
      {hasBg && <div className={styles.bg} aria-hidden="true" />}
      {hasBg && <div className={styles.scrim} aria-hidden="true" />}
      <div className={styles.brand}>
        <span className={styles.logo}>Disher</span>
      </div>
      <AuthForm />
    </div>
  );
}
