import { useEffect, useState } from 'react';
import { Text } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import { fetchAuthEvents, type AuthEvent } from '@/shared/lib/api/admin';
import styles from './AuthEventsList.module.scss';

// «Входы» tab of /admin — the answer to "почему у юзера не заходит". Defaults to
// problems-only: every login writes a row, and the successes drown the handful of
// failures we're actually looking for. `query` is the same search box as the
// users tab (email or user id substring).

interface Props {
  query: string;
}

// Human-readable reason. better-auth's codes are the machine trail; these are the
// ones a user actually hits, spelled out so the panel doesn't require reading the
// better-auth source to interpret.
const REASONS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'Неверная почта или пароль',
  EMAIL_NOT_VERIFIED: 'Почта не подтверждена',
  USER_ALREADY_EXISTS: 'Пользователь уже существует',
  PASSWORD_TOO_SHORT: 'Пароль короче 11 символов',
  INVALID_TOKEN: 'Ссылка недействительна или истекла',
  TOKEN_EXPIRED: 'Ссылка истекла',
  issuer_missing: 'Telegram не прислал iss (проверь requireIssuerValidation)',
  oauth_code_missing: 'Telegram не вернул код авторизации',
  state_mismatch: 'Не совпал state — вход начали в одном браузере, закончили в другом',
  please_restart_the_process: 'Сессия входа истекла — начать заново',
};

function reasonOf(event: AuthEvent): string {
  if (event.outcome === 'success') return 'Успешный вход';
  const code = event.errorCode ?? '';
  return REASONS[code] ?? event.errorMessage ?? code ?? 'Неизвестная ошибка';
}

function timeOf(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AuthEventsList({ query }: Props) {
  const [events, setEvents] = useState<AuthEvent[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [problemsOnly, setProblemsOnly] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setFailed(false);
    setEvents(null);
    fetchAuthEvents({ problemsOnly, q: query }, ac.signal)
      .then(setEvents)
      .catch(() => {
        if (!ac.signal.aborted) setFailed(true);
      });
    return () => ac.abort();
  }, [problemsOnly, query]);

  return (
    <div className={styles.list}>
      <div className={styles.filters}>
        <Button
          variant={problemsOnly ? 'system-secondary' : 'ghost'}
          flat
          onClick={() => setProblemsOnly(true)}
        >
          Только ошибки
        </Button>
        <Button
          variant={problemsOnly ? 'ghost' : 'system-secondary'}
          flat
          onClick={() => setProblemsOnly(false)}
        >
          Все попытки
        </Button>
      </div>

      {failed ? (
        <Text role="caption" as="p" className={styles.hint}>
          Не удалось загрузить события
        </Text>
      ) : events === null ? (
        <Text role="caption" as="p" className={styles.hint}>
          …
        </Text>
      ) : events.length === 0 ? (
        <Text role="caption" as="p" className={styles.hint}>
          {problemsOnly ? 'Ошибок входа нет' : 'Событий нет'}
        </Text>
      ) : (
        events.map((event) => (
          <div key={event.id} className={styles.row} data-outcome={event.outcome}>
            <div className={styles.identity}>
              <Text role="body" as="span" className={styles.who}>
                {event.email ?? event.userId ?? 'неизвестный'}
              </Text>
              <Text role="caption" as="span" className={styles.reason}>
                {reasonOf(event)}
              </Text>
              <Text role="caption" as="span" className={styles.meta}>
                {[
                  timeOf(event.createdAt),
                  event.provider ?? 'без провайдера',
                  event.statusCode ? String(event.statusCode) : null,
                  event.ip,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
