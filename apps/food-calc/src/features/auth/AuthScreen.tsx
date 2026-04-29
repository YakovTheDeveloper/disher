import { AuthForm } from './AuthForm';
import styles from './AuthScreen.module.scss';

/**
 * Fullscreen auth blocker. Mounted by AuthGate when there is no session.
 * On success the auth-store flips isLoggedIn → true and the gate unmounts.
 */
export function AuthScreen() {
  return (
    <div className={styles.screen} data-auth-theme="dark">
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />
      <div className={styles.brand}>
        <span className={styles.logo}>Disher</span>
      </div>
      <AuthForm />
    </div>
  );
}
