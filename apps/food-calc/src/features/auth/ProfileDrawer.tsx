import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAuthStore } from './auth-store';
import styles from './ProfileDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ThemePicker } from '@/features/theme';
import { dump, apply, syncNow } from '@/shared/lib/snapshot';
import { HoldButton } from './HoldButton';
import { BalanceSection } from './BalanceSection';
import { Text } from '@/shared/ui/atoms/Typography';

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
  // Sign-out lives behind a collapsed «Опасная зона» so it can't be hit by a
  // stray tap — the user must expand the section first (see task #15).
  const [dangerOpen, setDangerOpen] = useState(false);
  // The data import/export section is an accordion, collapsed by default —
  // a rarely-used backup primitive that shouldn't crowd the drawer at rest.
  const [dataOpen, setDataOpen] = useState(false);
  const [backupState, setBackupState] = useState<BackupState>('idle');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleBackup = async () => {
    setBackupState('saving');
    try {
      await syncNow();
      setBackupState('done');
    } catch (e) {
      console.error('manual backup sync failed', e);
      setBackupState('error');
    }
  };

  // Let the «Сохранено ✓» confirmation fade back to the idle label after a
  // beat, so a second manual backup later in the session is still offerable.
  useEffect(() => {
    if (backupState !== 'done') return;
    const t = setTimeout(() => setBackupState('idle'), 2000);
    return () => clearTimeout(t);
  }, [backupState]);

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
    <DrawerLayout title="Аккаунт" subtitle={email} className={styles.surface}>
      <div className={styles.container}>
        <BalanceSection />

        <section className={styles.section}>
          <Text as="h2" role="label" className={styles.sectionLabel}>Оформление</Text>
          <ThemePicker />
        </section>

        {/* Данные — accordion, collapsed by default. */}
        <section className={styles.section}>
          <button
            type="button"
            className={styles.accordionToggle}
            onClick={() => setDataOpen((v) => !v)}
            aria-expanded={dataOpen}
          >
            <Text as="span" role="label" className={styles.sectionLabel}>
              Данные
            </Text>
            <span
              className={clsx(styles.chevron, dataOpen && styles.chevronOpen)}
              aria-hidden
            >
              ⌄
            </span>
          </button>

          {dataOpen && (
            <div className={styles.accordionBody}>
              <p className={styles.dataHint}>
                Скачать копию данных в файл или загрузить ранее сохранённую.
              </p>
              <div className={styles.dataActions}>
                <button
                  type="button"
                  className={styles.dataBtn}
                  onClick={handleExport}
                >
                  Скачать файл
                </button>
                <button
                  type="button"
                  className={styles.dataBtn}
                  onClick={handleImport}
                >
                  Загрузить из файла
                </button>
              </div>
            </div>
          )}
        </section>

        {/*
          «Опасная зона» — last in the main flow, separated by a fading hairline.
          Still collapsed behind a toggle so sign-out can't be hit by a stray
          tap (task #15); the 5s hold is the second line of defence.
        */}
        <section className={styles.danger}>
          <button
            type="button"
            className={styles.dangerToggle}
            onClick={() => setDangerOpen((v) => !v)}
            aria-expanded={dangerOpen}
          >
            <Text as="span" role="label">
              Опасная зона
            </Text>
            <span
              className={clsx(styles.chevron, dangerOpen && styles.chevronOpen)}
              aria-hidden
            >
              ⌄
            </span>
          </button>

          {dangerOpen && (
            <div className={styles.dangerBody}>
              <p className={styles.dangerHint}>
                При выходе данные на этом устройстве очищаются. Они хранятся в
                облаке и вернутся при следующем входе — но лучше сохранить
                свежую копию прямо сейчас.
              </p>
              <button
                type="button"
                className={styles.backupBtn}
                onClick={handleBackup}
                disabled={backupState === 'saving'}
              >
                {BACKUP_LABEL[backupState]}
              </button>
              <HoldButton
                holdMs={HOLD_MS}
                onComplete={handleSignOut}
                busy={loggingOut}
                label="Удерживайте, чтобы выйти"
                activeLabel="Не отпускайте…"
                busyLabel="Выходим…"
              />
            </div>
          )}
        </section>
      </div>
    </DrawerLayout>
  );
}
