import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { useAuthStore } from './auth-store';
import styles from './ProfileDrawer.module.scss';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading } from '@/shared/ui/atoms/Typography';
import { ThemePicker } from '@/features/theme';
import { dump, apply, syncNow } from '@/shared/lib/snapshot';
import { HoldButton } from './HoldButton';

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

  const initial = email ? email[0].toUpperCase() : '?';

  // «Опасная зона» lives in DrawerLayout's pinned footer — not in the scroll
  // area — so it's always visible without scrolling past the theme picker.
  const dangerFooter = (
    <div className={styles.dangerFooter}>
      <section className={styles.danger}>
        <button
          type="button"
          className={styles.dangerToggle}
          onClick={() => setDangerOpen((v) => !v)}
          aria-expanded={dangerOpen}
        >
          <span>Опасная зона</span>
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
  );

  return (
    <DrawerLayout a11yLabel="Аккаунт и настройки" footer={dangerFooter}>
      <div className={styles.container}>
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <span className={styles.avatarLetter}>{initial}</span>
          </div>
          <Heading size="drawer" as="h1">Аккаунт</Heading>
          <p className={styles.email}>{email}</p>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Оформление</h2>
          <ThemePicker />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionLabel}>Данные</h2>
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
        </section>
      </div>
    </DrawerLayout>
  );
}
