import { useState } from 'react';
import Button from '@/shared/ui/atoms/Button/Button';
import { clear as idbClear } from 'idb-keyval';
import { clearPending } from '@/shared/lib/storage/pendingWrites';
import { queryClient } from '@/shared/lib/storage/queryClient';
import styles from './SettingsPage.module.scss';

const SettingsPage = () => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearStorage = async () => {
    setIsClearing(true);
    try {
      await clearPending();
      queryClient.clear();
      await idbClear();
      localStorage.clear();
      window.location.reload();
    } catch {
      setIsClearing(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Настройки</h1>
      </header>

      <div className={styles.content}>
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
