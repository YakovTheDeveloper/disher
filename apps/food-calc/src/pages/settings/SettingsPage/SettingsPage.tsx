import { useState } from 'react';
import Button from '@/shared/ui/atoms/Button/Button';
import { clear as idbClear } from 'idb-keyval';
import { db } from '@/shared/lib/dexie/schema';
import { dump, apply, push } from '@/shared/lib/snapshot';
import { ThemePicker } from '@/features/theme';
import styles from './SettingsPage.module.scss';

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

const SettingsPage = () => {
  const [isClearing, setIsClearing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const handleClearStorage = async () => {
    setIsClearing(true);
    try {
      await db.transaction('rw', db.tables, async () => {
        await Promise.all(db.tables.map((t) => t.clear()));
      });
      await idbClear();
      localStorage.clear();
      window.location.reload();
    } catch {
      setIsClearing(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    try {
      await push();
    } finally {
      setIsPushing(false);
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Тема</h2>
          <p className={styles.sectionDesc}>
            Семь палитр, основанных на оттенках расписания. Выбор сохраняется на этом устройстве.
          </p>
          <ThemePicker />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Бэкап</h2>
          <p className={styles.sectionDesc}>
            Раз в день при заходе в приложение твои данные уезжают в хранилище. Можно сохранить файл к себе на диск или загрузить ранее сохранённый.
          </p>
          <div className={styles.actions}>
            <Button onClick={handlePush} isLoading={isPushing}>
              Сохранить в хранилище
            </Button>
            <Button variant="secondary" onClick={handleExport}>
              Скачать файл
            </Button>
            <Button variant="secondary" onClick={handleImport}>
              Загрузить из файла
            </Button>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Данные</h2>
          <p className={styles.sectionDesc}>
            Если приложение работает некорректно или застряло при загрузке — очисти хранилище. Все локальные данные будут удалены.
          </p>
        </section>
      </div>

      <footer className={styles.footer}>
        <Button variant="danger" onClick={handleClearStorage} isLoading={isClearing}>
          Очистить хранилище и перезагрузить
        </Button>
      </footer>
    </div>
  );
};

export default SettingsPage;
