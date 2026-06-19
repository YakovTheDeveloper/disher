import { useEffect } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { useAuthStore } from './auth-store';
import styles from './AuthForm.module.scss';

type Props = {
  email: string;
  /** Geometry preset, see AuthForm. */
  layout?: 'card' | 'stretch';
};

/**
 * "Check your inbox" branch. Rendered by AuthScreen when
 * `auth-store.pendingVerificationEmail` is set (a fresh signUp succeeded or a
 * signIn returned 403 EMAIL_NOT_VERIFIED). Reuses AuthForm.module.scss so the
 * fullscreen theme overrides apply exactly the same way.
 */
export function CheckInboxView({ email, layout }: Props) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const requestResend = useAuthStore((s) => s.requestResendVerification);
  const clearPending = useAuthStore((s) => s.clearPendingVerification);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleResend = async () => {
    if (isLoading) return;
    clearError();
    await requestResend();
  };

  return (
    <div className={styles.container} data-auth-layout={layout}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Проверьте почту</h1>
        <p className={styles.subheading}>
          Мы отправили ссылку для подтверждения на <strong>{email}</strong>.
          Перейдите по ней, чтобы войти.
        </p>
      </header>

      <div className={styles.formWrap}>
        <div className={styles.form}>
          <Button
            variant="primary"
            className={styles.submitBtn}
            onClick={handleResend}
            disabled={isLoading}
          >
            {isLoading ? '…' : 'Отправить ссылку ещё раз'}
          </Button>
          {error && (
            <p className={styles.fieldError} role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <footer className={styles.footer}>
        <Button
          variant="link"
          className={styles.switchBtn}
          onClick={clearPending}
          disabled={isLoading}
        >
          Изменить email
        </Button>
      </footer>
    </div>
  );
}
