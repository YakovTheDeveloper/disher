import { AuthForm } from './AuthForm';
import { CheckInboxView } from './CheckInboxView';
import { DisherLogo } from './DisherLogo';
import { useAuthStore } from './auth-store';
import styles from './AuthScreen.module.scss';

/**
 * Fullscreen auth blocker. Mounted by AuthGate when there is no session.
 * On success the auth-store flips isLoggedIn → true and the gate unmounts.
 *
 * Облик — app-тон: бумага (--sys-color-surface-page) + field-токены формы.
 * Dark/photo-тема (v1-photo + dev-форки v2/v3/v4) снята 2026-06-24 — экран
 * входа переведён на общий тон приложения (card-раскладка по центру).
 */
export function AuthScreen() {
  const pendingEmail = useAuthStore((s) => s.pendingVerificationEmail);

  return (
    <div className={styles.screen}>
      {pendingEmail ? (
        <CheckInboxView email={pendingEmail} layout="card" />
      ) : (
        <AuthForm layout="card" />
      )}
      <div className={styles.brand}>
        <DisherLogo className={styles.logo} />
      </div>
    </div>
  );
}
