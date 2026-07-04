import { useEffect, useState } from 'react';
import { useAuthStore } from './auth-store';
import styles from './ProfileDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ThemePicker } from '@/features/theme';
import { WallpaperPicker } from '@/features/wallpaper';
import { dump, apply, deleteBackup } from '@/shared/lib/snapshot';
import { runSyncTracked } from '@/shared/lib/sync/runSync';
import { HoldButton } from './HoldButton';
import { BalanceSection } from './BalanceSection';
import { Text } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import { Switch } from '@/shared/ui/atoms/Switch';
import { Accordion } from '@/shared/ui/Accordion';
import { drawerStore } from '@/shared/ui/drawer-store';
import { useSyncPrefStore } from '@/shared/lib/sync-pref';
import { SyncStatusChip } from '@/features/sync-status/SyncStatusChip';
import SyncDisableDrawer from './SyncDisableDrawer';

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

// Sign-out must be held for 5s — a deliberately rare action (it wipes local
// Dexie). See task #15.
const HOLD_MS = 5000;

type BackupState = 'idle' | 'saving' | 'done' | 'error';

const BACKUP_LABEL: Record<BackupState, string> = {
  idle: 'Сохранить в хранилище',
  saving: 'Сохраняем…',
  done: 'Сохранено ✓',
  error: 'Не удалось — повторить',
};

// Closed via the DrawerLayout handle / swipe, or by `signOut` resetting the
// overlay stores — so it never reads the injected `onClose`.
export function ProfileDrawer() {
  const email = useAuthStore((s) => s.email);
  const signOut = useAuthStore((s) => s.signOut);
  const syncEnabled = useSyncPrefStore((s) => s.syncEnabled);
  const setSyncEnabled = useSyncPrefStore((s) => s.setSyncEnabled);
  // Sign-out lives behind a collapsed «Опасная зона» so it can't be hit by a
  // stray tap — the user must expand the section first (see task #15).
  const [dangerOpen, setDangerOpen] = useState(false);
  // The data import/export section is an accordion, collapsed by default —
  // a rarely-used backup primitive that shouldn't crowd the drawer at rest.
  const [dataOpen, setDataOpen] = useState(false);
  const [backupState, setBackupState] = useState<BackupState>('idle');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleBackup = async () => {
    // Route the manual backup through runSyncTracked so a failure is recorded in
    // the sync-status store AND surfaced as a toaster (not just the button
    // label) — a manual save that silently fails would be a no-silent-failure
    // violation. runSyncTracked never throws; the boolean drives the label.
    setBackupState('saving');
    const ok = await runSyncTracked({ surfaceToast: true });
    setBackupState(ok ? 'done' : 'error');
  };

  // Let the «Сохранено ✓» confirmation fade back to the idle label after a
  // beat, so a second manual backup later in the session is still offerable.
  useEffect(() => {
    if (backupState !== 'done') return;
    const t = setTimeout(() => setBackupState('idle'), 2000);
    return () => clearTimeout(t);
  }, [backupState]);

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
    // signOut wipes Dexie + idb-keyval and resets the overlay stores, which
    // unmounts this drawer — no explicit onClose() needed.
    setLoggingOut(true);
    await signOut();
  };

  return (
    // «Аккаунт» rides in the drawer's chrome row (next to the Close cross); the
    // email sits right under it as the chrome subtitle — together they form the
    // identity header, replacing the old centered avatar block. A soft peach→rose
    // ambient glow (`.surface`) sits behind that header, echoing HomeAmbient.
    <DrawerLayout title="Аккаунт" subtitle={email} className={styles.surface} contentInset="panel">
      <div className={styles.container}>
        <BalanceSection />

        <section className={styles.section}>
          <Text as="h2" role="label" className={styles.sectionLabel}>Оформление</Text>
          <ThemePicker />
        </section>

        {/* Обои — своя гравюра-обложка для каждого экрана (Рацион / События /
            Разборы), выбор из общего каталога. Пишется в localStorage, сразу
            читается hero-обложками. */}
        <section className={styles.section}>
          <Text as="h2" role="label" className={styles.sectionLabel}>Обои</Text>
          <WallpaperPicker />
        </section>

        {/*
          Синхронизация — облачный бэкап включён по умолчанию. Тумблер OFF ведёт
          через предупреждающий drawer (выгрузка + удаление серверной копии);
          ON — мгновенный re-push через syncNow (pull-first).
        */}
        <section className={styles.section}>
          <Text as="h2" role="label" className={styles.sectionLabel}>Синхронизация</Text>
          <div className={styles.syncRow}>
            <Text as="span" role="caption" className={styles.syncHint}>
              Хранить копию данных в облаке и синхронизировать между устройствами.
            </Text>
            <Switch
              checked={syncEnabled}
              onChange={handleSyncToggle}
              aria-label="Облачная синхронизация"
            />
          </div>
          {/* Ambient sync-status — переехал сюда из HomeTopBar. Ничего не рендерит
              в покое; показывает «Офлайн» / «Синхронизирую…» / «Не сохранено ·
              Повторить» (tap = retry). Обёртка hug-left, чтобы danger-фон не
              растягивался на всю ширину секции. */}
          <div className={styles.syncStatus}>
            <SyncStatusChip />
          </div>
        </section>

        {/* Данные — accordion, collapsed by default (примитив Accordion). */}
        <Accordion
          open={dataOpen}
          onToggle={setDataOpen}
          bodyClassName={styles.dataBody}
          title={
            <Text as="span" role="label" className={styles.sectionLabel}>
              Данные
            </Text>
          }
        >
          <Text as="p" role="caption" className={styles.dataHint}>
            Скачать копию данных в файл или загрузить ранее сохранённую.
          </Text>
          <div className={styles.dataActions}>
            <Button variant="system-secondary" flat onClick={handleExport}>
              Скачать файл
            </Button>
            <Button variant="system-secondary" flat onClick={handleImport}>
              Загрузить из файла
            </Button>
          </div>
        </Accordion>

        {/*
          «Опасная зона» — last in the main flow, separated by a fading hairline.
          Still collapsed behind a toggle so sign-out can't be hit by a stray
          tap (task #15); the 5s hold is the second line of defence. Wrapper
          `.danger` владеет parking (margin-top:auto) + красный hairline; сам
          раскрывающийся блок — примитив Accordion (danger-тон через headerClassName).
        */}
        <section className={styles.danger}>
          <Accordion
            open={dangerOpen}
            onToggle={setDangerOpen}
            headerClassName={styles.dangerHeader}
            bodyClassName={styles.dangerBody}
            title={
              <Text as="span" role="label">
                Опасная зона
              </Text>
            }
          >
            {/*
              Sync-aware: the cloud safety net only exists when sync is ON. With
              sync OFF, sign-out wipes Dexie with NO cloud restore — the old
              «вернутся при входе» promise would be a lie, and the manual cloud
              backup would no-op (and falsely flash «Сохранено ✓»), so it's hidden;
              the file-export path («Данные» above) is the safe backup.
            */}
            {syncEnabled ? (
              <>
                <Text as="p" role="caption" className={styles.dangerHint}>
                  При выходе данные на этом устройстве очищаются. Они хранятся в
                  облаке и вернутся при следующем входе — но лучше сохранить
                  свежую копию прямо сейчас.
                </Text>
                <Button
                  variant="system-secondary"
                  flat
                  fullWidth
                  onClick={handleBackup}
                  disabled={backupState === 'saving'}
                >
                  {BACKUP_LABEL[backupState]}
                </Button>
              </>
            ) : (
              <Text as="p" role="caption" className={styles.dangerHint}>
                При выходе данные на этом устройстве очищаются. Синхронизация
                выключена — копии в облаке нет, восстановить их не получится.
                Скачайте копию в разделе «Данные» перед выходом.
              </Text>
            )}
            <HoldButton
              holdMs={HOLD_MS}
              onComplete={handleSignOut}
              busy={loggingOut}
              label="Удерживайте, чтобы выйти"
              activeLabel="Не отпускайте…"
              busyLabel="Выходим…"
            />
          </Accordion>
        </section>
      </div>
    </DrawerLayout>
  );
}
