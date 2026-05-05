import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from './auth-store';
import styles from './AuthForm.module.scss';

type Mode = 'signIn' | 'signUp';
type Step = 'email' | 'password';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Synced with backend auth/server.ts emailAndPassword.minPasswordLength.
const MIN_PASSWORD = 12;

type Props = {
  /** Initial mode for the form. Defaults to signIn. */
  initialMode?: Mode;
  /** Called on successful auth — typically closes the host (drawer) or is a no-op (gate, store flips automatically). */
  onSuccess?: () => void;
  /** Headline copy override for the email step. */
  signInSubheadline?: string;
  signUpSubheadline?: string;
  /** Geometry preset. `card` = centered glass card (V1 photo), `stretch` = edge-to-edge fullscreen (V2/V3/V4). Drawer hosts pass nothing → base centered 360px layout. */
  layout?: 'card' | 'stretch';
};

/**
 * Two-step email → password auth form. Hosted by AuthDrawer (transient) and
 * AuthScreen (fullscreen blocker). All state is local except auth-store
 * loading / error.
 */
export function AuthForm({
  initialMode = 'signIn',
  onSuccess,
  signInSubheadline = '',
  signUpSubheadline = '',
  layout,
}: Props) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const signUp = useAuthStore((s) => s.signUp);
  const signIn = useAuthStore((s) => s.signIn);
  const clearError = useAuthStore((s) => s.clearError);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  useEffect(() => {
    if (step === 'password') passwordRef.current?.focus();
    if (step === 'email') emailRef.current?.focus();
  }, [step]);

  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_RE.test(normalizedEmail);
  const passwordValid = password.length >= MIN_PASSWORD;

  const heading =
    step === 'email'
      ? mode === 'signIn'
        ? 'Вход'
        : 'Регистрация'
      : mode === 'signIn'
        ? 'Введите пароль'
        : 'Придумайте пароль';

  const subheading =
    step === 'email'
      ? mode === 'signIn'
        ? signInSubheadline
        : signUpSubheadline
      : normalizedEmail;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setEmailError('Введите корректный email');
      return;
    }
    setEmailError(null);
    clearError();
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid || isLoading) return;
    if (mode === 'signIn') {
      const ok = await signIn(normalizedEmail, password);
      if (ok) onSuccess?.();
      return;
    }
    // signUp under requireEmailVerification: success means "verification email
    // sent", not "logged in". onSuccess closes the host (drawer) — skip it so
    // AuthScreen / AuthDrawer can render the CheckInbox branch driven by
    // pendingVerificationEmail.
    await signUp(normalizedEmail, password);
  };

  const handleBack = () => {
    clearError();
    setPassword('');
    setStep('email');
  };

  const handleSwitchMode = () => {
    setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
    setPassword('');
    setStep('email');
  };

  const submitLabel = isLoading ? '…' : mode === 'signUp' ? 'Создать аккаунт' : 'Войти';

  return (
    <div className={styles.container} data-auth-layout={layout}>
      <header className={styles.header}>
        {step === 'password' && (
          <button type="button" className={styles.backBtn} onClick={handleBack} aria-label="Назад">
            ←
          </button>
        )}
        <h1 className={styles.heading}>{heading}</h1>
        <p className={styles.subheading}>{subheading}</p>
      </header>

      <div className={styles.formWrap}>
        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <input
                ref={emailRef}
                type="email"
                inputMode="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                className={styles.input}
                autoFocus
                autoComplete="email"
                spellCheck={false}
                autoCapitalize="off"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'auth-email-error' : undefined}
                disabled={isLoading}
              />
              {emailError && (
                <p id="auth-email-error" className={styles.fieldError} role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <button type="submit" className={styles.submitBtn} disabled={!emailValid}>
              Продолжить
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <input
                ref={passwordRef}
                type="password"
                placeholder={mode === 'signIn' ? 'Пароль' : `Пароль (от ${MIN_PASSWORD} символов)`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                minLength={MIN_PASSWORD}
                aria-invalid={!!error}
                aria-describedby={error ? 'auth-form-error' : undefined}
                disabled={isLoading}
              />
              {error && (
                <p id="auth-form-error" className={styles.fieldError} role="alert">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!passwordValid || isLoading}
            >
              {submitLabel}
            </button>
          </form>
        )}
      </div>

      <footer className={styles.footer}>
        <button
          type="button"
          className={styles.switchBtn}
          onClick={handleSwitchMode}
          disabled={isLoading}
        >
          {mode === 'signIn' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </footer>
    </div>
  );
}
