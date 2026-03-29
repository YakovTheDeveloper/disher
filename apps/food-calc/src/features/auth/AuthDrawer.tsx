import { useState } from 'react';
import { useAuthStore } from './auth-store';
import styles from './AuthDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';

type Tab = 'login' | 'register';

export function AuthDrawer({ onClose }: BaseDrawerProps) {
  const { isLoading, error, login } = useAuthStore();
  const [tab, setTab] = useState<Tab>('login');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    await login(emailInput.trim());
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    await login(emailInput.trim(), nameInput.trim() || undefined);
    onClose();
  };

  return (
    <DrawerLayout>
      <div className={styles.container}>
        {/* ─── Form area — centered vertically ─── */}
        <div className={styles.formArea}>
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className={styles.form}>
              <span className={styles.title}>Вход</span>
              <input
                type="email"
                placeholder="Email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className={styles.input}
                autoFocus
                disabled={isLoading}
              />
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading || !emailInput.trim()}
              >
                {isLoading ? '...' : 'Войти'}
              </button>
              {error && <p className={styles.error}>{error}</p>}
            </form>
          ) : (
            <form onSubmit={handleRegister} className={styles.form}>
              <span className={styles.title}>Регистрация</span>
              <input
                type="text"
                placeholder="Имя (необязательно)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className={styles.input}
                disabled={isLoading}
              />
              <input
                type="email"
                placeholder="Email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className={styles.input}
                autoFocus
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading || !emailInput.trim()}
              >
                {isLoading ? '...' : 'Создать'}
              </button>
              {error && <p className={styles.error}>{error}</p>}
            </form>
          )}
        </div>

        {/* ─── Bottom tabs — easy thumb reach ─── */}
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
            Регистрация
          </button>
        </div>
      </div>
    </DrawerLayout>
  );
}
