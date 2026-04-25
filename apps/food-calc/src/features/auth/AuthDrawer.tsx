import { useEffect, useState } from 'react';
import { useAuthStore } from './auth-store';
import styles from './AuthDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';

type Tab = 'login' | 'register';

export function AuthDrawer({ onClose }: BaseDrawerProps) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const upgradeAnonymous = useAuthStore((s) => s.upgradeAnonymous);
  const signUp = useAuthStore((s) => s.signUp);
  const signIn = useAuthStore((s) => s.signIn);
  const clearError = useAuthStore((s) => s.clearError);

  const [tab, setTab] = useState<Tab>('register');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmSignIn, setConfirmSignIn] = useState(false);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  useEffect(() => {
    clearError();
    setConfirmSignIn(false);
  }, [tab, clearError]);

  const submitDisabled =
    isLoading || !emailInput.trim() || passwordInput.length < 6;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;
    // If the user is currently anonymous, upgrade in place so the UUID and
    // local data are preserved. Otherwise create a fresh account.
    const ok = isAnonymous
      ? await upgradeAnonymous(emailInput.trim(), passwordInput)
      : await signUp(emailInput.trim(), passwordInput);
    if (ok) onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitDisabled) return;
    if (isAnonymous && !confirmSignIn) {
      setConfirmSignIn(true);
      return;
    }
    const ok = await signIn(emailInput.trim(), passwordInput);
    if (ok) onClose();
  };

  return (
    <DrawerLayout>
      <div className={styles.container}>
        <div className={styles.formArea}>
          {tab === 'login' ? (
            <form onSubmit={handleSignIn} className={styles.form}>
              <span className={styles.title}>Вход</span>
              <input
                type="email"
                placeholder="Email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className={styles.input}
                autoFocus
                disabled={isLoading}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={styles.input}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {isAnonymous && confirmSignIn && (
                <p className={styles.warning}>
                  Это удалит данные, накопленные в текущем устройстве. Продолжить?
                </p>
              )}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitDisabled}
              >
                {isLoading
                  ? '...'
                  : isAnonymous && confirmSignIn
                    ? 'Удалить и войти'
                    : 'Войти'}
              </button>
              {error && <p className={styles.error}>{error}</p>}
            </form>
          ) : (
            <form onSubmit={handleRegister} className={styles.form}>
              <span className={styles.title}>
                {isAnonymous ? 'Сохранить данные' : 'Регистрация'}
              </span>
              {isAnonymous && (
                <p className={styles.hint}>
                  Текущие данные сохранятся под новым аккаунтом.
                </p>
              )}
              <input
                type="email"
                placeholder="Email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className={styles.input}
                autoFocus
                required
                disabled={isLoading}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Пароль (мин. 6 символов)"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className={styles.input}
                disabled={isLoading}
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitDisabled}
              >
                {isLoading ? '...' : isAnonymous ? 'Сохранить' : 'Создать'}
              </button>
              {error && <p className={styles.error}>{error}</p>}
            </form>
          )}
        </div>

        <div className={styles.bottomTabs}>
          <button
            className={`${styles.tab} ${tab === 'login' ? styles.tabActive : ''}`}
            onClick={() => setTab('login')}
          >
            Вход
          </button>
          <button
            className={`${styles.tab} ${tab === 'register' ? styles.tabActive : ''}`}
            onClick={() => setTab('register')}
          >
            {isAnonymous ? 'Сохранить' : 'Регистрация'}
          </button>
        </div>
      </div>
    </DrawerLayout>
  );
}
