import { useDesignVariants } from '@/shared/lib/useDesignVariants';
import { shouldShowDvBar } from '@/app/ui/DesignVariantsBar';
import { AuthForm } from './AuthForm';
import { CheckInboxView } from './CheckInboxView';
import { DisherLogo } from './DisherLogo';
import { useAuthStore } from './auth-store';
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

const LAYOUT_BY_VARIANT: Record<Variant, 'card' | 'stretch'> = {
  'v1-photo': 'card',
  'v2-yandex': 'stretch',
  'v3-yandex-bg1': 'stretch',
  'v4-yandex-bg2': 'stretch',
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
  const layout = LAYOUT_BY_VARIANT[variant];
  const pendingEmail = useAuthStore((s) => s.pendingVerificationEmail);

  return (
    <div className={styles.screen} data-auth-variant={variant} data-auth-theme={theme}>
      {hasBg && <div className={styles.bg} aria-hidden="true" />}
      {hasBg && <div className={styles.scrim} aria-hidden="true" />}
      {pendingEmail ? (
        <CheckInboxView email={pendingEmail} layout={layout} />
      ) : (
        <AuthForm layout={layout} />
      )}
      <div className={styles.brand}>
        <DisherLogo className={styles.logo} />
      </div>
    </div>
  );
}
