import { useState, useEffect, useCallback, useRef } from 'react';
import { triplit } from '@/api/triplit/client';
import { getSessionInfo } from '@/api/triplit/session';
import type { ConnectionStatus } from '@triplit/client';
import Tabs from '@/shared/ui/Tabs/Tabs';
import Button from '@/shared/ui/atoms/Button/Button';
import styles from './SystemPage.module.scss';

// ─── Types ───

type CollectionName =
  | 'foods'
  | 'foodPortions'
  | 'foodNutrients'
  | 'nutrients'
  | 'dishes'
  | 'dishItems'
  | 'dishPortions'
  | 'dailyNorms'
  | 'dailyNormItems'
  | 'scheduleFoods'
  | 'scheduleEvents';

type CollectionCount = { name: CollectionName; count: number | null; error?: string };

type LogEntry = {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
};

const ALL_COLLECTIONS: CollectionName[] = [
  'nutrients',
  'foods',
  'foodPortions',
  'foodNutrients',
  'dishes',
  'dishItems',
  'dishPortions',
  'dailyNorms',
  'dailyNormItems',
  'scheduleFoods',
  'scheduleEvents',
];

const TABS = [
  { value: 'sync', alternativeLabel: 'Sync' },
  { value: 'reset', alternativeLabel: 'Reset' },
];

// ─── Helpers ───

const now = () => new Date().toLocaleTimeString('ru-RU', { hour12: false });

const statusEmoji: Record<ConnectionStatus, string> = {
  UNINITIALIZED: '⚪',
  CONNECTING: '🟡',
  OPEN: '🟢',
  CLOSING: '🟠',
  CLOSED: '🔴',
};

// ─── Sync Tab ───

function SyncTab() {
  const [connection, setConnection] = useState<ConnectionStatus>(triplit.connectionStatus);
  const [counts, setCounts] = useState<CollectionCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [idbDatabases, setIdbDatabases] = useState<string[]>([]);
  const [serverUrl] = useState(() => (triplit as any).serverUrl ?? 'unknown');
  const [tokenLabel] = useState(() => {
    const t = triplit.token;
    if (!t) return 'none';
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.sub ? `user: ${payload.sub}` : 'anon';
    } catch {
      return 'invalid';
    }
  });
  const logsEndRef = useRef<HTMLDivElement>(null);

  const sessionInfo = getSessionInfo();

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    setLogs((prev) => [...prev.slice(-99), { time: now(), level, message }]);
  }, []);

  // Connection status listener
  useEffect(() => {
    const unsub = triplit.onConnectionStatusChange((status) => {
      setConnection(status);
      addLog('info', `Connection: ${status}`);
    }, true);
    return unsub;
  }, [addLog]);

  // List IndexedDB databases
  useEffect(() => {
    if ('databases' in indexedDB) {
      indexedDB.databases().then((dbs) => {
        setIdbDatabases(dbs.map((d) => d.name ?? '(unnamed)'));
      });
    }
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Auto-fetch counts on mount
  const fetchCounts = useCallback(async () => {
    setLoading(true);
    addLog('info', 'Fetching collection counts...');

    const results: CollectionCount[] = [];
    for (const name of ALL_COLLECTIONS) {
      try {
        const res = await triplit.fetch(triplit.query(name as any) as any);
        const count = res instanceof Map ? res.size : Array.isArray(res) ? res.length : 0;
        results.push({ name, count });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push({ name, count: null, error: msg });
        addLog('error', `${name}: ${msg}`);
      }
    }

    setCounts(results);
    setLoading(false);
    addLog('info', 'Done.');
  }, [addLog]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleReconnect = useCallback(async () => {
    addLog('info', 'Forcing reconnect...');
    try {
      await triplit.endSession();
      const savedToken = localStorage.getItem('triplit_token');
      const anonToken = import.meta.env.VITE_TRIPLIT_TOKEN;
      const token = savedToken ?? anonToken;
      if (token) {
        await triplit.startSession(token);
        addLog('info', savedToken ? 'Reconnected with user token.' : 'Reconnected with anon token.');
      } else {
        addLog('warn', 'No token available.');
      }
    } catch (e) {
      addLog('error', `Reconnect failed: ${e instanceof Error ? e.message : e}`);
    }
  }, [addLog]);

  const totalCount = counts.reduce((sum, c) => sum + (c.count ?? 0), 0);

  return (
    <div className={styles.tabContent}>
      {/* Session */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Session</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Mode</span>
            <span className={styles.value}>{sessionInfo.mode}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Connected</span>
            <span className={styles.value}>{sessionInfo.connected ? 'yes' : 'no'}</span>
          </div>
          {sessionInfo.skippedReason && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Reason</span>
              <span className={styles.value}>{sessionInfo.skippedReason}</span>
            </div>
          )}
          {Object.keys(sessionInfo.localCounts).length > 0 && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Cached</span>
              <span className={styles.value}>
                {Object.entries(sessionInfo.localCounts)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Connection */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Connection</h2>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Status</span>
            <span className={styles.value}>
              {statusEmoji[connection]} {connection}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Server</span>
            <span className={styles.value}>{serverUrl}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Token</span>
            <span className={styles.value}>{tokenLabel}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Schema ver.</span>
            <span className={styles.value}>{localStorage.getItem('triplit_schema_version') ?? '—'}</span>
          </div>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleReconnect}>
            Reconnect
          </Button>
          <Button variant="secondary" onClick={fetchCounts} isLoading={loading}>
            Refresh counts
          </Button>
        </div>
      </section>

      {/* Collections */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Collections {counts.length > 0 && <span className={styles.totalBadge}>{totalCount}</span>}
        </h2>
        {counts.length === 0 ? (
          <p className={styles.muted}>Loading...</p>
        ) : (
          <div className={styles.table}>
            {counts.map((c) => (
              <div key={c.name} className={styles.tableRow}>
                <span className={styles.tableName}>{c.name}</span>
                <span className={c.error ? styles.tableError : styles.tableCount}>
                  {c.error ?? c.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* IndexedDB */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>IndexedDB</h2>
        {idbDatabases.length === 0 ? (
          <p className={styles.muted}>No databases found</p>
        ) : (
          <div className={styles.chipList}>
            {idbDatabases.map((name) => (
              <span key={name} className={styles.chip}>{name}</span>
            ))}
          </div>
        )}
      </section>

      {/* Storage */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>LocalStorage</h2>
        <div className={styles.infoGrid}>
          {Array.from({ length: localStorage.length }, (_, i) => {
            const key = localStorage.key(i)!;
            const val = localStorage.getItem(key) ?? '';
            return (
              <div key={key} className={styles.storageRow}>
                <span className={styles.label}>{key}</span>
                <span className={styles.value}>{val.length > 80 ? val.slice(0, 80) + '…' : val}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Logs */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Logs</h2>
        <div className={styles.logBox}>
          {logs.length === 0 && <span className={styles.muted}>No logs yet. Tap an action above.</span>}
          {logs.map((log, i) => (
            <div key={i} className={`${styles.logLine} ${styles[`log_${log.level}`]}`}>
              <span className={styles.logTime}>{log.time}</span> {log.message}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </section>
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
    req.onblocked = () => {
      console.warn(`[reset] DB "${name}" is blocked — forcing resolve`);
      resolve();
    };
  });

const clearAllLocal = async () => {
  const knownDBs = ['triplit', 'triplit-cache', 'triplit-outbox', 'triplit-metadata'];
  await Promise.all(knownDBs.map(deleteDatabase));

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
      console.error('[reset] Error:', e);
      setErrorMsg(e instanceof Error ? e.message : 'Unknown error');
      setStatus('error');
    }
  };

  return (
    <div className={styles.tabContent}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Clear all local data</h2>
        <p className={styles.sectionDesc}>
          Deletes all IndexedDB databases, localStorage, sessionStorage, and Cache API. The app will reload and re-sync from the server.
        </p>

        {status === 'idle' && (
          <div className={styles.actions}>
            <Button variant="danger" onClick={handleReset}>
              Clear everything &amp; reload
            </Button>
          </div>
        )}

        {status === 'resetting' && (
          <div className={styles.statusBox}>
            <div className={styles.spinner} />
            <span>Clearing...</span>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.statusBox}>
            <span className={styles.successText}>Done! Redirecting...</span>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.statusBox}>
            <span className={styles.errorText}>Failed: {errorMsg}</span>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── System Page ───

const SystemPage = () => {
  const [tab, setTab] = useState('sync');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>System</h1>
      </header>

      <Tabs tabs={TABS} current={tab} setTab={setTab} />

      {tab === 'sync' && <SyncTab />}
      {tab === 'reset' && <ResetTab />}
    </div>
  );
};

export default SystemPage;
