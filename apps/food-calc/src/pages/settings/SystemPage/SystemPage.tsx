import { useState } from 'react';
import Tabs from '@/shared/ui/Tabs/Tabs';
import Button from '@/shared/ui/atoms/Button/Button';
import { getMutationLog, clearMutationLog } from '@/shared/lib/mutationLog';
import styles from './SystemPage.module.scss';

const TABS = [
  { value: 'storage', alternativeLabel: 'Storage' },
  { value: 'reset', alternativeLabel: 'Reset' },
];

// ─── Storage Tab ───

function StorageTab() {
  return (
    <div className={styles.tabContent}>
      {/* LocalStorage card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>LocalStorage</span>
        </div>
        {Array.from({ length: localStorage.length }, (_, i) => {
          const key = localStorage.key(i)!;
          const val = localStorage.getItem(key) ?? '';
          return (
            <div key={key} className={styles.storageRow}>
              <span className={styles.storageKey}>{key}</span>
              <span className={styles.storageVal}>{val.length > 80 ? val.slice(0, 80) + '…' : val}</span>
            </div>
          );
        })}
      </div>

      {/* Mutation errors card */}
      <MutationLogCard />
    </div>
  );
}

// ─── Mutation Log Card ───

function MutationLogCard() {
  const [entries, setEntries] = useState(() => getMutationLog());

  const handleClear = () => {
    clearMutationLog();
    setEntries([]);
  };

  if (entries.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Ошибки мутаций ({entries.length})</span>
        <Button variant="secondary" onClick={handleClear}>Очистить</Button>
      </div>
      <div className={styles.logBox}>
        {entries.map((entry, i) => (
          <div key={i} className={`${styles.logLine} ${styles.log_error}`}>
            <span className={styles.logTime}>{new Date(entry.ts).toLocaleTimeString('ru-RU', { hour12: false })}</span>
            <span>{entry.op}: {entry.err}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reset Tab ───

type ResetStatus = 'idle' | 'resetting' | 'success' | 'error';

const deleteDatabase = (name: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error(`Failed to delete DB: ${name}`));
    req.onblocked = () => { console.warn(`[reset] DB "${name}" is blocked — forcing resolve`); resolve(); };
  });

const clearAllLocal = async () => {
  if ('databases' in indexedDB) {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases
        .filter((db): db is IDBDatabaseInfo & { name: string } => !!db.name)
        .map((db) => deleteDatabase(db.name)),
    );
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  localStorage.clear();
  sessionStorage.clear();
};

function ResetTab() {
  const [status, setStatus] = useState<ResetStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async () => {
    setStatus('resetting');
    try {
      await clearAllLocal();
      setStatus('success');
      setTimeout(() => window.location.replace('/'), 1200);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
      setStatus('error');
    }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Очистить локальные данные</span>
        </div>
        <p className={styles.sectionDesc}>
          Удаляет все IndexedDB, localStorage, sessionStorage и Cache API.
          Приложение перезагрузится.
        </p>

        {status === 'idle' && (
          <div className={styles.cardActions}>
            <Button variant="danger" onClick={handleReset}>Очистить всё и перезагрузить</Button>
          </div>
        )}
        {status === 'resetting' && (
          <div className={styles.statusBox}>
            <div className={styles.spinner} />
            <span className={styles.muted}>Очищаю…</span>
          </div>
        )}
        {status === 'success' && (
          <div className={styles.statusBox}>
            <span className={styles.successText}>Готово! Перенаправляю…</span>
          </div>
        )}
        {status === 'error' && (
          <div className={styles.statusBox}>
            <span className={styles.errorText}>Ошибка: {errorMsg}</span>
            <Button variant="secondary" onClick={() => window.location.reload()}>Повтор</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── System Page ───

const SystemPage = () => {
  const [tab, setTab] = useState('storage');

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>System</h1>
      </header>

      <div className={styles.tabsWrap}>
        <Tabs tabs={TABS} current={tab} setTab={setTab} />
      </div>

      {tab === 'storage' && <StorageTab />}
      {tab === 'reset' && <ResetTab />}
    </div>
  );
};

export default SystemPage;
