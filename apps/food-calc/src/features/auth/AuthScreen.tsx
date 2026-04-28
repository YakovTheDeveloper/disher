import { AuthForm } from './AuthForm';
import styles from './AuthScreen.module.scss';

/**
 * Fullscreen auth blocker. Mounted by AuthGate when there is no session.
 * On success the auth-store flips isLoggedIn → true and the gate unmounts.
 */
export function AuthScreen() {
  return (
    <div className={styles.screen}>
      <div className={styles.brand}>
        <span className={styles.logo}>Disher</span>
      </div>
      <AuthForm />
    </div>
  );
}
