import { AuthForm } from './AuthForm';
import { CheckInboxView } from './CheckInboxView';
import { DisherLogo } from './DisherLogo';
import { useAuthStore } from './auth-store';
import styles from './AuthScreen.module.scss';

/**
 * Fullscreen auth blocker. Mounted by AuthGate when there is no session.
 * On success the auth-store flips isLoggedIn → true and the gate unmounts.
 *
 * Облик — фикс `v1-photo` (баком 2026-06-22: dev-форки v2/v3/v4 сняты, v1-photo
 * был продакшен-дефолтом): dark-тема, фоновое фото + scrim, card-раскладка.
 * Экран входа всё равно под редизайн — дефолт временный.
 */
export function AuthScreen() {
  const pendingEmail = useAuthStore((s) => s.pendingVerificationEmail);

  return (
    <div className={styles.screen} data-auth-variant="v1-photo" data-auth-theme="dark">
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />
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
