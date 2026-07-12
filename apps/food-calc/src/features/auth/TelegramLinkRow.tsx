import { useEffect, useState } from 'react';
import { useAuthStore } from './auth-store';
import { authProvider } from '@/shared/lib/auth/authProvider';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ActionList } from '@/shared/ui/ActionList';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import TelegramIcon from '@/shared/assets/icons/telegram.svg?react';

/**
 * «Привязать Telegram» — единственный безопасный путь дойти до ОДНОГО аккаунта
 * и по email, и через Telegram. Telegram не отдаёт email, поэтому better-auth
 * не может слить их сам: обычный вход через Telegram у email-юзера завёл бы
 * ВТОРОЙ аккаунт со своим (пустым) кошельком. Здесь провайдер цепляется к уже
 * залогиненной сессии.
 *
 * Ряд исчезает, когда Telegram уже привязан. `null` (ещё грузим / запрос упал)
 * тоже прячет ряд — лучше не показать привязку, чем показать её тому, у кого
 * она уже есть.
 */
export function TelegramLinkRow() {
  const linkTelegram = useAuthStore((s) => s.linkTelegram);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [linked, setLinked] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void authProvider.listLinkedProviders().then((ids) => {
      if (alive) setLinked(ids.includes('telegram'));
    });
    return () => {
      alive = false;
    };
  }, []);

  // Секцию рендерим здесь, а не в ProfileDrawer: иначе у привязанного юзера
  // остался бы заголовок «Вход» над пустотой.
  if (linked !== false) return null;

  return (
    <ActionList.Section label="Вход">
      <SettingRow
        icon={<TelegramIcon width={18} height={18} />}
        label="Привязать Telegram"
        sub="Входить без пароля — тот же аккаунт и баланс"
        trailing={<ChevronGlyph />}
        onClick={() => void linkTelegram()}
        disabled={isLoading}
        aria-label="Привязать Telegram к аккаунту"
      />
    </ActionList.Section>
  );
}
