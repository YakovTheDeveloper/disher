import { useState, type ReactNode } from 'react';
import Heading from '@/shared/ui/atoms/Typography/Heading/Heading';
import Text from '@/shared/ui/atoms/Typography/Text/Text';
import Numeral from '@/shared/ui/atoms/Typography/Numeral/Numeral';
import Button from '@/shared/ui/atoms/Button/Button';
import DownloadIcon from '@/shared/assets/icons/download.svg?react';
import MoreIcon from '@/shared/assets/icons/more.svg?react';
import { usePwaInstall } from './usePwaInstall';
import styles from './PwaInstallGate.module.scss';

// iOS «Поделиться» глиф (квадрат со стрелкой вверх) — в assets его нет,
// инлайним currentColor-иконку под шаг инструкции.
function ShareGlyph() {
  return (
    <svg
      className={styles.stepGlyph}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15V3" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 12H5a2 2 0 0 0-2 2v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

function PlusSquareGlyph() {
  return (
    <svg
      className={styles.stepGlyph}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

/**
 * Полноэкранный гейт установки PWA. Рендерится сиблингом в App (вне AuthGate),
 * поверх всего. «Сильно настаивает» — крупный CTA/инструкция — но оставляет
 * escape-hatch «продолжить в браузере» (сессионное отклонение). Показывается
 * только на мобильных вне standalone; на десктопе и в установленном приложении
 * возвращает null (см. usePwaInstall).
 */
export function PwaInstallGate() {
  const { shouldShow, platform, canPromptInstall, isIosSafari, promptInstall, dismiss } =
    usePwaInstall();
  const [prompting, setPrompting] = useState(false);

  if (!shouldShow) return null;

  const handleInstall = async () => {
    setPrompting(true);
    try {
      await promptInstall();
    } finally {
      setPrompting(false);
    }
  };

  return (
    <div className={styles.gate} role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
      <div className={styles.card}>
        <img className={styles.icon} src="/icon-192.png" alt="" width={88} height={88} />

        <Heading role="headline" id="pwa-install-title" className={styles.title}>
          Установите Disher на телефон
        </Heading>

        <Text role="body" className={styles.lede}>
          Без установки приложение работает заметно хуже: медленнее открывается,
          теряет полноэкранный режим и офлайн-доступ к вашим данным. Установка —
          один раз, места почти не занимает.
        </Text>

        {platform === 'android' ? (
          <AndroidBody
            canPromptInstall={canPromptInstall}
            prompting={prompting}
            onInstall={handleInstall}
          />
        ) : (
          <IosBody isIosSafari={isIosSafari} />
        )}

        <button type="button" className={styles.escape} onClick={dismiss}>
          <Text as="span" role="caption">
            Продолжить в браузере
          </Text>
        </button>
      </div>
    </div>
  );
}

function AndroidBody({
  canPromptInstall,
  prompting,
  onInstall,
}: {
  canPromptInstall: boolean;
  prompting: boolean;
  onInstall: () => void;
}) {
  if (canPromptInstall) {
    return (
      <Button
        variant="accent"
        fullWidth
        isLoading={prompting}
        onClick={onInstall}
        icon={<DownloadIcon width={20} height={20} />}
        className={styles.cta}
      >
        Установить приложение
      </Button>
    );
  }

  // Prompt ещё не пришёл (или уже израсходован) — ручная инструкция для Chrome.
  return (
    <ol className={styles.steps}>
      <Step glyph={<MoreIcon className={styles.stepGlyph} width={22} height={22} />}>
        Откройте меню браузера (три точки вверху справа)
      </Step>
      <Step glyph={<DownloadIcon className={styles.stepGlyph} width={22} height={22} />}>
        Выберите «Установить приложение» или «Добавить на главный экран»
      </Step>
    </ol>
  );
}

function IosBody({ isIosSafari }: { isIosSafari: boolean }) {
  if (!isIosSafari) {
    return (
      <div className={styles.notice}>
        <Text role="body">
          Откройте этот сайт в <b>Safari</b> — из других браузеров на iPhone
          установить приложение нельзя. Скопируйте ссылку и вставьте в Safari.
        </Text>
      </div>
    );
  }

  return (
    <ol className={styles.steps}>
      <Step glyph={<ShareGlyph />}>
        Нажмите «Поделиться» — иконку внизу экрана
      </Step>
      <Step glyph={<PlusSquareGlyph />}>
        Пролистайте меню и выберите «На экран „Домой“»
      </Step>
      <Step glyph={<Numeral size="lg" weight="bold">3</Numeral>}>
        Нажмите «Добавить» — значок появится на рабочем столе
      </Step>
    </ol>
  );
}

function Step({ glyph, children }: { glyph: ReactNode; children: ReactNode }) {
  return (
    <li className={styles.step}>
      <span className={styles.stepIcon} aria-hidden="true">
        {glyph}
      </span>
      <Text as="span" role="body" className={styles.stepText}>
        {children}
      </Text>
    </li>
  );
}

export default PwaInstallGate;
