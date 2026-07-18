import { useEffect, useState } from 'react';
import { Button } from '@/shared/ui/atoms/Button';
import { useAuthStore } from './auth-store';
import { consumeOAuthReturnError } from '@/shared/lib/auth/oauthReturn';
import { DEV_LOGIN_EMAIL, DEV_LOGIN_PASSWORD } from '@/shared/config/devLogin';
import styles from './AuthForm.module.scss';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import TelegramIcon from '@/shared/assets/icons/telegram.svg?react';

// 2026-07-13: на AuthScreen основной путь — вход/регистрация через Telegram.
// Email+пароль оставлен только как ВХОД (без регистрации) за тихой кнопкой
// «Войти по email» — нужен, чтобы зайти под сид-админом на проде. Полная
// двухшаговая форма с регистрацией + verify-email закомментирована ниже.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// type Mode = 'signIn' | 'signUp';
// type Step = 'email' | 'password';
//
// // Synced with backend auth/server.ts emailAndPassword.minPasswordLength —
// // менять ТОЛЬКО парой, иначе форма и сервер разойдутся в валидации.
// const MIN_PASSWORD = 11;

type Props = {
  // /** Initial mode for the form. Defaults to signIn. */
  // initialMode?: Mode;
  // /** Called on successful auth — typically closes the host (drawer) or is a no-op (gate, store flips automatically). */
  // onSuccess?: () => void;
  // /** Headline copy override for the email step. */
  // signInSubheadline?: string;
  // signUpSubheadline?: string;
  /** Geometry preset. `card` = centered glass card (V1 photo), `stretch` = edge-to-edge fullscreen (V2/V3/V4). Drawer hosts pass nothing → base centered 360px layout. */
  layout?: 'card' | 'stretch';
};

/**
 * Telegram-only auth. Hosted by AuthScreen (fullscreen blocker). The redirect
 * navigates away on success, so the only thing that comes back here is a
 * failure to START it — surfaced as the error banner under the button.
 */
export function AuthForm({ layout }: Props) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const signInWithTelegram = useAuthStore((s) => s.signInWithTelegram);
  const signIn = useAuthStore((s) => s.signIn);
  const clearError = useAuthStore((s) => s.clearError);
  const reportOAuthReturnError = useAuthStore((s) => s.reportOAuthReturnError);

  // Вход по email — только ВХОД (без регистрации), за тихой кнопкой. Нужен для
  // захода под сид-админом на проде, где Telegram-аккаунт админом не является.
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Провал Telegram-входа приезжает 302-редиректом с `?authError=` / `?error=`
  // в URL (см. oauthReturn.ts) — без этого чтения юзер молча оказывается на
  // логине без объяснения. Маркер съедается из адресной строки один раз.
  useEffect(() => {
    const oauthError = consumeOAuthReturnError();
    if (oauthError) reportOAuthReturnError(oauthError.code);
  }, [reportOAuthReturnError]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const normalizedEmail = email.trim().toLowerCase();
  const canSubmit = EMAIL_RE.test(normalizedEmail) && password.length > 0 && !isLoading;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    await signIn(normalizedEmail, password);
  };

  return (
    <div className={styles.container} data-auth-layout={layout}>
      <header className={styles.header}>
        <Heading as="h1" role="headline" className={styles.heading}>
          Вход
        </Heading>
      </header>

      <div className={styles.formWrap}>
        {emailMode ? (
          <form onSubmit={handleEmailSignIn} className={styles.form} noValidate>
            <div className={styles.field}>
              <input
                type="email"
                inputMode="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                className={styles.input}
                autoComplete="email"
                spellCheck={false}
                autoCapitalize="off"
                disabled={isLoading}
              />
            </div>

            <div className={styles.field}>
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                className={styles.input}
                autoComplete="current-password"
                aria-invalid={!!error}
                aria-describedby={error ? 'auth-form-error' : undefined}
                disabled={isLoading}
              />
            </div>

            {error && (
              <p id="auth-form-error" className={styles.fieldError} role="alert">
                <Text as="span" role="caption">
                  {error}
                </Text>
              </p>
            )}

            <Button variant="system" type="submit" className={styles.submitBtn} disabled={!canSubmit}>
              {isLoading ? '…' : 'Войти'}
            </Button>

            <footer className={styles.footer}>
              <Button
                variant="link"
                className={styles.switchBtn}
                onClick={() => {
                  setEmailMode(false);
                  clearError();
                }}
                disabled={isLoading}
              >
                Назад
              </Button>
            </footer>
          </form>
        ) : (
          <div className={styles.altAuth}>
            <Button
              variant="system"
              fullWidth
              type="button"
              icon={<TelegramIcon />}
              onClick={() => signInWithTelegram()}
              disabled={isLoading}
            >
              Войти через Telegram
            </Button>

            {/* Dev-only shortcut into the account seeded by the backend
                (seed-dev.ts). Stripped from prod builds via import.meta.env.DEV. */}
            {import.meta.env.DEV && (
              <Button
                variant="system"
                type="button"
                className={styles.devBtn}
                onClick={() => signIn(DEV_LOGIN_EMAIL, DEV_LOGIN_PASSWORD)}
                disabled={isLoading}
              >
                Войти (Dev)
              </Button>
            )}

            {error && (
              <p id="auth-form-error" className={styles.fieldError} role="alert">
                <Text as="span" role="caption">
                  {error}
                </Text>
              </p>
            )}

            <footer className={styles.footer}>
              <Button
                variant="link"
                className={styles.switchBtn}
                onClick={() => {
                  setEmailMode(true);
                  clearError();
                }}
                disabled={isLoading}
              >
                Войти по email
              </Button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Email + пароль (отключено 2026-07-13) ─────────────────────────────────
Чтобы вернуть: раскомментировать типы/константы выше, этот блок и заменить им
тело AuthForm; проп-контракт (initialMode / onSuccess / *Subheadline) тоже выше.

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
  const signInWithTelegram = useAuthStore((s) => s.signInWithTelegram);
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
    // sent", not "logged in" — skip onSuccess so AuthScreen renders the
    // CheckInbox branch driven by pendingVerificationEmail.
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
        <Heading as="h1" role="headline" className={styles.heading}>{heading}</Heading>
        <Text as="p" role="caption" className={styles.subheading}>{subheading}</Text>
      </header>

      <div className={styles.formWrap}>
        {step === 'email' ? (
          <>
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
                autoComplete="email"
                spellCheck={false}
                autoCapitalize="off"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'auth-email-error' : undefined}
                disabled={isLoading}
              />
              {emailError && (
                <p id="auth-email-error" className={styles.fieldError} role="alert">
                  <Text as="span" role="caption">{emailError}</Text>
                </p>
              )}
            </div>

            <Button variant="system" type="submit" className={styles.submitBtn} disabled={!emailValid}>
              Продолжить
            </Button>
          </form>
          <div className={styles.altAuth}>
            <Text as="p" role="caption" className={styles.altDivider}>
              или
            </Text>
            <Button
              variant="system"
              type="button"
              className={styles.telegramBtn}
              onClick={() => signInWithTelegram()}
              disabled={isLoading}
            >
              Войти через Telegram
            </Button>
          </div>
          </>
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
                  <Text as="span" role="caption">{error}</Text>
                </p>
              )}
            </div>

            <Button
              variant="system"
              type="submit"
              className={styles.submitBtn}
              disabled={!passwordValid || isLoading}
            >
              {submitLabel}
            </Button>
          </form>
        )}
      </div>

      <footer className={styles.footer}>
        <Button
          variant="link"
          className={styles.switchBtn}
          onClick={handleSwitchMode}
          disabled={isLoading}
        >
          {mode === 'signIn' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </Button>
      </footer>
    </div>
  );
}
──────────────────────────────────────────────────────────────────────────── */
