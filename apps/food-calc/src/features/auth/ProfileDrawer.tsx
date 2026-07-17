import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './auth-store';
import { authProvider } from '@/shared/lib/auth/authProvider';
import toaster from '@/shared/lib/toaster/toaster';
import { defaultUserMessage } from '@/shared/lib/errors/classify';
import { useIsAdmin } from '@/features/admin/useIsAdmin';
import { RouterLinks } from '@/shared/config/routes';
import styles from './ProfileDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { WallpaperPicker } from '@/features/wallpaper';
import { CardPalettePicker } from '@/features/card-palette';
import { dump } from '@/shared/lib/snapshot';
import { BalanceSection } from './BalanceSection';
import { TelegramLinkRow } from './TelegramLinkRow';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ActionList } from '@/shared/ui/ActionList';
import SignOutConfirmModal from './SignOutConfirmModal';
import { Text } from '@/shared/ui/atoms/Typography';
import { IconButton } from '@/shared/ui/atoms/Button';
import { Switch } from '@/shared/ui/atoms/Switch';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import MoonIcon from '@/shared/assets/icons/moon.svg?react';
import SunIcon from '@/shared/assets/icons/sun.svg?react';
import EyeIcon from '@/shared/assets/icons/eye.svg?react';
import DownloadIcon from '@/shared/assets/icons/download.svg?react';
import LogoutIcon from '@/shared/assets/icons/logout.svg?react';
import FlagIcon from '@/shared/assets/icons/flag.svg?react';
import SettingsIcon from '@/shared/assets/icons/settings.svg?react';
import { drawerStore } from '@/shared/ui/drawer-store';
import { modalStore } from '@/shared/ui/modal-store';
import { useColorModeStore } from '@/shared/lib/color-mode';
import { SyncStatusChip } from '@/features/sync-status/SyncStatusChip';
import { ReportProblemModal } from '@/features/feedback';

const downloadJson = (name: string, obj: unknown) => {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

// Closed via the DrawerLayout handle / swipe, or by `signOut` resetting the
// overlay stores — so it never reads the injected `onClose`.
export function ProfileDrawer() {
  const email = useAuthStore((s) => s.email);
  const signOut = useAuthStore((s) => s.signOut);
  const colorMode = useColorModeStore((s) => s.mode);
  const setColorMode = useColorModeStore((s) => s.setMode);
  const navigate = useNavigate();
  // Client gate for the «Админка» entry — UX only, the server guards /api/admin.
  // null (undecided) / false → row hidden; only a definite true shows it.
  const isAdmin = useIsAdmin();
  // Один drawer, два экрана: корень (identity + компактные разделы) и под-экран
  // «Внешний вид» (высокие пикеры Обои + Цвет карточек). Навигация — локальный
  // стейт + DrawerLayout.onBack (крест → стрелка «Назад»). Свежий mount при
  // каждом drawerStore.show сбрасывает в 'root' — between-opens не храним.
  const [screen, setScreen] = useState<'root' | 'appearance'>('root');
  // «Сообщить о проблеме» — упрощённый прод-репорт (ModalByLabel, одно поле).
  // isExpanded гоняется отсюда по клику ряда; модалка накрывает дровер сверху.
  const [reportOpen, setReportOpen] = useState(false);
  // Отзыв чужих сессий — сетевой вызов без своей модалки; флаг держит ряд
  // задизейбленным, чтобы двойной тап не слал второй запрос.
  const [revoking, setRevoking] = useState(false);

  // Экспорт — «твои данные твои», НЕ бэкап: загрузить файл обратно нечем
  // (импорт снесён 2026-07-16, сервер — единственное хранилище). Подпись «Скачать
  // копию в файл» возврата не обещает — не превращать её в обещание.
  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadJson(`disher-${today}.json`, await dump());
  };

  // «Я потерял телефон». Сессия опаковая, не ротируется и живёт 365 дней —
  // потерянное устройство остаётся внутри, пока строку сессии не удалят. Этот ряд
  // и удаляет: все ДРУГИЕ сессии, текущая остаётся (юзер просил выселить чужих, а
  // не выйти самому). Локальные данные не трогаются — это не выход, а отзыв.
  const handleRevokeOtherSessions = async () => {
    if (revoking) return;
    setRevoking(true);
    const result = await authProvider.revokeOtherSessions();
    setRevoking(false);
    if (result.ok) {
      toaster.success('Другие устройства вышли из аккаунта');
      return;
    }
    toaster.error(defaultUserMessage(result.error), { kind: result.error });
  };

  const handleSignOut = async () => {
    // The barrier against a stray tap is the typed-confirm modal («удалить»),
    // not a collapsed section — so the danger row can sit open in the drawer.
    // The modal is also where the sync-aware backup offer now lives.
    const confirmed = await modalStore.show(SignOutConfirmModal, {});
    if (confirmed !== true) return;
    // The modal already ran the final sync (and, on failure, got an explicit
    // "выйти всё равно") — don't run it a second time here.
    // signOut wipes Dexie + idb-keyval and resets the overlay stores, which
    // unmounts this drawer — no explicit onClose() needed.
    await signOut({ skipFinalSync: true });
  };

  return (
    // «Аккаунт» rides in the drawer's chrome row (next to the Close cross); the
    // email sits right under it as the chrome subtitle — together they form the
    // identity header, replacing the old centered avatar block. A soft peach→rose
    // ambient glow (`.surface`) sits behind that header, echoing HomeAmbient.
    <DrawerLayout
      title={screen === 'root' ? 'Аккаунт' : 'Декор'}
      subtitle={screen === 'root' ? email : undefined}
      onBack={screen === 'root' ? undefined : () => setScreen('root')}
      className={styles.surface}
      contentInset="panel"
      // Быстрый тумблер темы живёт в chrome-слоте шапки (topRight) — светлая/тёмная
      // одним тапом, без раскрытия секции. Иконка показывает режим, в который
      // ПЕРЕКЛЮЧИШЬСЯ: луна на светлой теме, солнце на тёмной. Ось режима — см.
      // lib/color-mode (ортогональна «Обои» / «Цвет карточек»).
      topRight={
        <IconButton
          tone="ghost"
          onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
          aria-label={colorMode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          icon={
            colorMode === 'dark' ? (
              <SunIcon width={18} height={18} />
            ) : (
              <MoonIcon width={18} height={18} />
            )
          }
        />
      }
    >
      {screen === 'appearance' ? (
        // Под-экран «Внешний вид» — высокие пикеры Обои + Цвет карточек, ушедшие
        // с корня за одну nav-строку. Подписи — h3 (заголовок drawer = h2, тело
        // держит h3+ для корректного outline; см. DrawerLayout.title).
        <ActionList className={styles.appearanceFlow}>
          {/* Обои — своя гравюра-обложка для каждого экрана (Рацион / События /
              Разборы), выбор из общего каталога. Пишется в localStorage, сразу
              читается hero-обложками. */}
          <ActionList.Section as="h3" label="Обои">
            <WallpaperPicker />
          </ActionList.Section>

          {/* Цвет карточек — постоянный пер-поверхностный выбор палитры (еда
              расписания / события / ингредиенты блюда). Переехал сюда из dev-
              DesignBar. Пишется в localStorage, сразу читается поверхностями. */}
          <ActionList.Section as="h3" label="Цвет карточек">
            <CardPalettePicker />
          </ActionList.Section>
        </ActionList>
      ) : (
        <ActionList className={styles.container}>
          <BalanceSection />

          {/* «Привязать Telegram» — сам себя прячет, когда уже привязан. */}
          <TelegramLinkRow />

          {/* Внешний вид — СЕКЦИЯ (не аккордеон): дубль быстрого тумблера тёмной
            темы из шапки + ряд-вход на под-экран декора. Пикеры (обои + палитра
            карточек) высокие → уведены на под-экран, аккордеон вернул бы простыню.
            Плоские ряды делятся тающей бровкой, БЕЗ плашки (канон paper-mono). */}
          <ActionList.Section label="Внешний вид">
            <div className={styles.rows}>
              <SettingRow
                icon={<MoonIcon width={18} height={18} />}
                label="Тёмная тема"
                trailing={
                  <Switch
                    checked={colorMode === 'dark'}
                    onChange={(next) => setColorMode(next ? 'dark' : 'light')}
                    aria-label="Тёмная тема"
                  />
                }
              />
              <SettingRow
                icon={<EyeIcon width={18} height={18} />}
                label="Обои и цвет карточек"
                trailing={<ChevronGlyph />}
                onClick={() => setScreen('appearance')}
                aria-label="Внешний вид: обои и цвет карточек"
              />
            </div>
          </ActionList.Section>

          {/* Данные — ряд-кнопка, не кнопка-плашка. «Загрузить из файла» снесён
            2026-07-16 вместе с тумблером: сервер — единственное хранилище, и
            восстановление = зайти в аккаунт, а не подсунуть файл.
            Своей секции «Синхронизация» больше нет: чип в покое не рендерит
            НИЧЕГО — отдельный заголовок стоял бы над пустотой. Чип приехал сюда:
            показывает «Офлайн» / «Синхронизирую…» / «Не сохранено» + иконку-повтор.
            Обёртка hug-left, чтобы danger-фон не растягивался на всю ширину. */}
          <ActionList.Section label="Данные">
            <div className={styles.rows}>
              <SettingRow
                icon={<DownloadIcon width={18} height={18} />}
                label="Скачать копию в файл"
                trailing={<ChevronGlyph />}
                onClick={handleExport}
              />
            </div>
            <div className={styles.syncStatus}>
              <SyncStatusChip />
            </div>
          </ActionList.Section>

          {/* Админка — единственный вход в /admin (топап баланса). Виден ТОЛЬКО
              когда useIsAdmin===true (role='admin' или env-админ через probe).
              Сидит внизу основного потока, над «Опасной зоной» — служебный вход,
              не повседневная настройка. Навигация закрывает дровер, иначе он
              остался бы висеть над страницей. */}
          {isAdmin === true && (
            <ActionList.Section label="Админка">
              <div className={styles.rows}>
                <SettingRow
                  icon={<SettingsIcon width={18} height={18} />}
                  label="Админка"
                  trailing={<ChevronGlyph />}
                  onClick={() => {
                    navigate(RouterLinks.Admin);
                    drawerStore.closeLast();
                  }}
                  aria-label="Открыть админ-панель"
                />
              </div>
            </ActionList.Section>
          )}

          {/*
          «Опасная зона» — показана СРАЗУ (аккордеон убран): барьер от промаха
          несёт модалка с типовым вводом «удалить», а не свёртка. Случайный тап
          по ряду лишь открывает модалку. Sync-aware бэкап-оффер и предупреждение
          «нет облачной копии» переехали внутрь модалки. Обёртка `.danger` держит
          парковку снизу (margin-top:auto) + красную тающую бровку сверху. Danger —
          bespoke (не ActionList.Section): свой красный тон + парковка не обобщены.
        */}
          <section className={styles.danger}>
            <Text as="h2" role="label" className={styles.dangerLabel}>
              Опасная зона
            </Text>
            <div className={styles.rows}>
              {/* Отзыв чужих сессий стоит НАД выходом: он безопаснее (локальные
                  данные целы, это устройство остаётся внутри) и решает другую
                  задачу — «телефон потерян», а не «я ухожу». */}
              <SettingRow
                danger
                icon={<LogoutIcon width={18} height={18} />}
                label="Выйти на других устройствах"
                sub={
                  revoking
                    ? 'Завершаем сессии…'
                    : 'Завершит сессии везде, кроме этого устройства'
                }
                trailing={<ChevronGlyph />}
                onClick={handleRevokeOtherSessions}
                disabled={revoking}
              />
              <SettingRow
                danger
                icon={<LogoutIcon width={18} height={18} />}
                label="Выйти из аккаунта"
                sub="Спросит подтверждение — ввод «удалить»"
                trailing={<ChevronGlyph />}
                onClick={handleSignOut}
              />
            </div>
          </section>

          {/* «Сообщить о проблеме» — самый низ дровера, ПОД опасной зоной
              (danger держит margin-top:auto, поэтому этот ряд паркуется у нижнего
              края последним). Клик разворачивает упрощённую модалку с описанием. */}
          <ActionList.Section label="Обратная связь">
            <div className={styles.rows}>
              <SettingRow
                icon={<FlagIcon width={18} height={18} />}
                label="Сообщить о проблеме"
                sub="Опишите проблему или предложение"
                trailing={<ChevronGlyph />}
                onClick={() => setReportOpen(true)}
                aria-label="Сообщить о проблеме"
              />
            </div>
          </ActionList.Section>

          {/* Build-штамп — видимая с телефона правда о том, какая сборка запущена
              (протокол верификации PWA-обновления, без chrome://inspect). */}
          <Text role="caption" className={styles.buildStamp}>
            Сборка {__BUILD_ID__} · {__BUILT_AT__.slice(0, 16).replace('T', ' ')}
          </Text>
        </ActionList>
      )}

      <ReportProblemModal isExpanded={reportOpen} onClose={() => setReportOpen(false)} />
    </DrawerLayout>
  );
}
