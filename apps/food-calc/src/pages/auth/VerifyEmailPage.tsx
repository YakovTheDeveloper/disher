import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authClient } from '@/shared/lib/auth/betterAuthClient';
import { Button } from '@/shared/ui/atoms/Button';
import { useAuthStore } from '@/features/auth/auth-store';
import authScreenStyles from '@/features/auth/AuthScreen.module.scss';
import authFormStyles from '@/features/auth/AuthForm.module.scss';

type VerifyState =
  | { kind: 'verifying' }
  | { kind: 'success' }
  | { kind: 'error'; message: string }
  | { kind: 'no-token' };

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const clearPending = useAuthStore((s) => s.clearPendingVerification);

  const token = params.get('token');
  const [state, setState] = useState<VerifyState>(() =>
    token ? { kind: 'verifying' } : { kind: 'no-token' },
  );

  const fired = useRef(false);

  useEffect(() => {
    if (!token || fired.current) return;
    fired.current = true;

    let cancelled = false;
    (async () => {
      try {
        const { error } = await authClient.verifyEmail({ query: { token } });
        if (cancelled) return;
        if (error) {
          setState({
            kind: 'error',
            message:
              error.message ||
              'Ссылка недействительна или истекла. Запросите новую.',
          });
          return;
        }
        clearPending();
        setState({ kind: 'success' });
        setTimeout(() => {
          if (!cancelled) navigate('/', { replace: true });
        }, 1500);
      } catch (e) {
        if (cancelled) return;
        setState({
          kind: 'error',
          message:
            e instanceof Error && e.message
              ? e.message
              : 'Не удалось подтвердить email. Проверьте соединение и попробуйте снова.',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, clearPending]);

  return (
    <div
      className={authScreenStyles.screen}
      data-auth-variant="v1-photo"
      data-auth-theme="dark"
    >
      <div className={authScreenStyles.bg} aria-hidden="true" />
      <div className={authScreenStyles.scrim} aria-hidden="true" />
      <div className={authScreenStyles.brand}>
        <span className={authScreenStyles.logo}>Disher</span>
      </div>

      <div className={authFormStyles.container}>
        <header className={authFormStyles.header}>
          <h1 className={authFormStyles.heading}>{titleFor(state)}</h1>
          <p className={authFormStyles.subheading}>{subtitleFor(state)}</p>
        </header>

        {(state.kind === 'error' || state.kind === 'no-token') && (
          <div className={authFormStyles.formWrap}>
            <div className={authFormStyles.form}>
              <Button
                variant="primary"
                className={authFormStyles.submitBtn}
                onClick={() => {
                  clearPending();
                  navigate('/', { replace: true });
                }}
              >
                На главную
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function titleFor(state: VerifyState): string {
  switch (state.kind) {
    case 'verifying':
      return 'Подтверждаем email…';
    case 'success':
      return 'Готово';
    case 'error':
      return 'Ссылка не сработала';
    case 'no-token':
      return 'Ссылка не содержит токен';
  }
}

function subtitleFor(state: VerifyState): string {
  switch (state.kind) {
    case 'verifying':
      return 'Минутку, проверяем токен.';
    case 'success':
      return 'Email подтверждён. Сейчас перенесём в приложение.';
    case 'error':
      return state.message;
    case 'no-token':
      return 'Откройте письмо ещё раз и кликните по ссылке полностью.';
  }
}
