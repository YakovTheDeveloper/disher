import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from './auth-store';
import { useIsAdmin } from '@/features/admin/useIsAdmin';
import { RouterLinks } from '@/app/router';
import styles from './ProfileDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { WallpaperPicker } from '@/features/wallpaper';
import { CardPalettePicker } from '@/features/card-palette';
import { dump, apply, deleteBackup } from '@/shared/lib/snapshot';
import { runSyncTracked } from '@/shared/lib/sync/runSync';
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
import CloudIcon from '@/shared/assets/icons/cloud.svg?react';
import DownloadIcon from '@/shared/assets/icons/download.svg?react';
import UploadIcon from '@/shared/assets/icons/upload.svg?react';
import LogoutIcon from '@/shared/assets/icons/logout.svg?react';
import FlagIcon from '@/shared/assets/icons/flag.svg?react';
import SettingsIcon from '@/shared/assets/icons/settings.svg?react';
import { drawerStore } from '@/shared/ui/drawer-store';
import { modalStore } from '@/shared/ui/modal-store';
import { useSyncPrefStore } from '@/shared/lib/sync-pref';
import { useColorModeStore } from '@/shared/lib/color-mode';
import { SyncStatusChip } from '@/features/sync-status/SyncStatusChip';
import SyncDisableDrawer from './SyncDisableDrawer';
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

const pickJson = (): Promise<unknown> =>
  new Promise((res, rej) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return rej(new Error('cancelled'));
      try {
        res(JSON.parse(await file.text()));
      } catch (e) {
        rej(e);
      }
    };
    input.click();
  });

// Closed via the DrawerLayout handle / swipe, or by `signOut` resetting the
// overlay stores — so it never reads the injected `onClose`.
export function ProfileDrawer() {
  const email = useAuthStore((s) => s.email);
  const signOut = useAuthStore((s) => s.signOut);
  const syncEnabled = useSyncPrefStore((s) => s.syncEnabled);
  const setSyncEnabled = useSyncPrefStore((s) => s.setSyncEnabled);
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

  // Cloud-sync toggle. Enabling is benign/immediate (re-push local via the
  // pull-first syncNow chokepoint — never a bare push that could clobber the
  // vault). Disabling is the private/destructive path: warn via SyncDisableDrawer
  // (with a data-export offer), and only on confirm flip the flag OFF and erase
  // the server copy (consent withdrawal). On cancel the switch stays ON (it
  // reads from the store, which we never touched).
  const handleSyncToggle = async (next: boolean) => {
    if (next) {
      setSyncEnabled(true);
      // Re-push through the tracked wrapper so a failed re-enable is visible
      // (toaster + store) instead of a console-only log.
      void runSyncTracked({ surfaceToast: true });
      return;
    }
    const confirmed = await drawerStore.show(SyncDisableDrawer, {});
    if (confirmed !== true) return; // cancel / swipe-close → stays ON
    setSyncEnabled(false);
    try {
      await deleteBackup();
    } catch (e) {
      // Best-effort: the flag is already OFF (no further egress); the vault
      // erase can be retried by toggling OFF again, or it never existed (404).
      console.error('vault erase on sync-off failed', e);
    }
  };

  const handleExport = async () => {
    const today = new Date().toISOString().slice(0, 10);
    downloadJson(`disher-${today}.json`, await dump());
  };

  const handleImport = async () => {
    const snap = await pickJson();
    await apply(snap as never);
    window.location.reload();
  };

  const handleSignOut = async () => {
    // The barrier against a stray tap is the typed-confirm modal («удалить»),
    // not a collapsed section — so the danger row can sit open in the drawer.
    // The modal is also where the sync-aware backup offer now lives.
    const confirmed = await modalStore.show(SignOutConfirmModal, { syncEnabled });
    if (confirmed !== true) return;
    // signOut wipes Dexie + idb-keyval and resets the overlay stores, which
    // unmounts this drawer — no explicit onClose() needed.
    await signOut();
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

          {/*
          Синхронизация — облачный бэкап включён по умолчанию. Тумблер OFF ведёт
          через предупреждающий drawer (выгрузка + удаление серверной копии);
          ON — мгновенный re-push через syncNow (pull-first). Статус синхры —
          отдельной строкой под рядом (не смешан с тумблером).
        */}
          <ActionList.Section label="Синхронизация">
            <div className={styles.rows}>
              <SettingRow
                icon={<CloudIcon width={18} height={18} />}
                label="Облачная копия"
                sub="Хранить данные в облаке, синхронизировать между устройствами"
                trailing={
                  <Switch
                    checked={syncEnabled}
                    onChange={handleSyncToggle}
                    aria-label="Облачная синхронизация"
                  />
                }
              />
            </div>
            {/* Ambient sync-status — переехал сюда из HomeTopBar. Ничего не рендерит
              в покое; показывает «Офлайн» / «Синхронизирую…» / «Не сохранено» +
              иконку-повтор. Обёртка hug-left, чтобы danger-фон не растягивался на
              всю ширину секции. */}
            <div className={styles.syncStatus}>
              <SyncStatusChip />
            </div>
          </ActionList.Section>

          {/* Данные — раскрыты рядами (аккордеон убран): два действия не стоят
            свёртки. Действия = ряды-кнопки, не кнопки-плашки. */}
          <ActionList.Section label="Данные">
            <div className={styles.rows}>
              <SettingRow
                icon={<DownloadIcon width={18} height={18} />}
                label="Скачать копию в файл"
                trailing={<ChevronGlyph />}
                onClick={handleExport}
              />
              <SettingRow
                icon={<UploadIcon width={18} height={18} />}
                label="Загрузить из файла"
                trailing={<ChevronGlyph />}
                onClick={handleImport}
              />
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
        </ActionList>
      )}

      <ReportProblemModal isExpanded={reportOpen} onClose={() => setReportOpen(false)} />
    </DrawerLayout>
  );
}
