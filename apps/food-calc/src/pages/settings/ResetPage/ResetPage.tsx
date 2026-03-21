import { useEffect, useState } from 'react';
import styles from './ResetPage.module.scss';

type ResetStatus = 'resetting' | 'success' | 'error';

const deleteDatabase = (name: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(new Error(`Failed to delete DB: ${name}`));
    req.onblocked = () => {
      console.warn(`[reset] DB "${name}" is blocked — forcing resolve`);
      resolve();
    };
  });

const clearAllIndexedDB = async () => {
  // 1. Known Triplit databases
  const knownDBs = [
    'triplit',
    'triplit-cache',
    'triplit-outbox',
    'triplit-metadata',
  ];
  await Promise.all(knownDBs.map(deleteDatabase));

  // 2. Enumerate and delete ALL remaining databases
  if ('databases' in indexedDB) {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases
        .filter((db): db is IDBDatabaseInfo & { name: string } => !!db.name)
        .map((db) => deleteDatabase(db.name))
    );
  }

  // 3. Clear Cache API (if any cached assets)
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
};

const ResetPage = () => {
  const [status, setStatus] = useState<ResetStatus>('resetting');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await clearAllIndexedDB();
        localStorage.clear();
        sessionStorage.clear();
        setStatus('success');
        setTimeout(() => window.location.replace('/'), 1200);
      } catch (e) {
        console.error('[reset] Error:', e);
        setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
        setStatus('error');
      }
    })();
  }, []);

  return (
    <div className={styles.container}>
      {status === 'resetting' && (
        <>
          <div className={styles.spinner} />
          <p className={styles.text}>Clearing local data...</p>
        </>
      )}
      {status === 'success' && (
        <p className={styles.textSuccess}>Done! Redirecting...</p>
      )}
      {status === 'error' && (
        <>
          <p className={styles.textError}>Failed to reset</p>
          {errorMsg && <p className={styles.detail}>{errorMsg}</p>}
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
};

export default ResetPage;
