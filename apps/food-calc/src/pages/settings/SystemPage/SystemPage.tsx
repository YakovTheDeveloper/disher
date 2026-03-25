import { useState, useEffect, useCallback, useRef } from 'react';
import { triplit } from '@/api/triplit/client';
import {
  getSessionInfo, getSyncLog, onSyncLogChange, API_BASE,
  getSyncStatus, onSyncStatusChange,
  getSyncProgress, onSyncProgressChange,
} from '@/api/triplit/session';
import type { SyncLogEntry, SyncStatus, SyncProgress, CollectionSyncState } from '@/api/triplit/session';
import type { ConnectionStatus } from '@triplit/client';
import Tabs from '@/shared/ui/Tabs/Tabs';
import Button from '@/shared/ui/atoms/Button/Button';
import styles from './SystemPage.module.scss';

// ─── Local count helpers ───

async function countLocal(name: CollectionName): Promise<number> {
  // @ts-expect-error — dynamic collection name
  const results = await triplit.fetch(triplit.query(name));
  return results instanceof Map ? results.size : (results as unknown[]).length;
}

// ─── Types ───

type CollectionName =
  | 'foods'
  | 'foodPortions'
  | 'nutrients'
  | 'dishes'
  | 'dishItems'
  | 'dishPortions'
  | 'dailyNorms'
  | 'scheduleFoods'
  | 'scheduleEvents'
  | 'users'
  | 'accounts';

type Counts = Record<string, number | null>;

type LogEntry = {
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
};

// ─── Entity groups ───

const ENTITY_GROUPS = [
  {
    key: 'products',
    title: 'Продукты',
    items: [
      { name: 'foods' as CollectionName,         label: 'foods',         hasServer: true },
      { name: 'foodPortions' as CollectionName,  label: 'foodPortions',  hasServer: true },
      { name: 'nutrients' as CollectionName,     label: 'nutrients',     hasServer: true },
    ],
  },
  {
    key: 'dishes',
    title: 'Блюда',
    items: [
      { name: 'dishes' as CollectionName,     label: 'dishes',   hasServer: false },
      { name: 'dishItems' as CollectionName,  label: 'items',    hasServer: false },
      { name: 'dishPortions' as CollectionName, label: 'portions', hasServer: false },
    ],
  },
  {
    key: 'norms',
    title: 'Нормы',
    items: [
      { name: 'dailyNorms' as CollectionName, label: 'dailyNorms', hasServer: true },
    ],
  },
  {
    key: 'schedule',
    title: 'Расписание',
    items: [
      { name: 'scheduleFoods' as CollectionName,  label: 'scheduleFoods',  hasServer: false },
      { name: 'scheduleEvents' as CollectionName, label: 'scheduleEvents', hasServer: false },
    ],
  },
  {
    key: 'account',
    title: 'Аккаунт',
    items: [
      { name: 'users' as CollectionName,    label: 'users',    hasServer: false },
      { name: 'accounts' as CollectionName,  label: 'accounts', hasServer: false },
    ],
  },
] as const;

const ALL_COLLECTIONS: CollectionName[] = ENTITY_GROUPS.flatMap((g) =>
  g.items.map((i) => i.name),
);

const TABS = [
  { value: 'sync', alternativeLabel: 'Sync' },
  { value: 'reset', alternativeLabel: 'Reset' },
];

// ─── Helpers ───

const now = () => new Date().toLocaleTimeString('ru-RU', { hour12: false });

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : String(n);

const connectionLabel: Record<ConnectionStatus, string> = {
  UNINITIALIZED: 'не инициализировано',
  CONNECTING:    'подключение...',
  OPEN:          'подключено',
  CLOSING:       'отключение...',
  CLOSED:        'отключено',
};

// ─── Collection row sync indicator ───

function CollectionStateIcon({ state }: { state: CollectionSyncState | undefined }) {
  if (!state || state === 'pending') return null;
  if (state === 'syncing') return <span className={styles.rowSpinner} />;
  if (state === 'done') return null; // the green dot on rowIndicator is enough
  if (state === 'timeout') return <span className={styles.rowTimeoutIcon} title="Таймаут">⚠</span>;
  return null;
}

// ─── Data Card ───

function DataCard({
  localCounts,
  serverCounts,
  loading,
  syncProgress,
  isSyncing,
}: {
  localCounts: Counts;
  serverCounts: Counts | null;
  loading: boolean;
  syncProgress: SyncProgress;
  isSyncing: boolean;
}) {
  // Compute banner state
  const serverItems = ENTITY_GROUPS.flatMap((g) => g.items.filter((i) => i.hasServer));
  const allSynced = !isSyncing && serverCounts != null && serverItems.every((item) => {
    const local = localCounts[item.name] ?? 0;
    const server = serverCounts[item.name];
    return server != null && local === server && local > 0;
  });
  const anyMismatch = !isSyncing && serverCounts != null && serverItems.some((item) => {
    const local = localCounts[item.name] ?? 0;
    const server = serverCounts[item.name];
    return server != null && local !== server;
  });

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Данные</span>
        <div className={styles.cardLegend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDot_local}`} />
            загружено
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendDot_server}`} />
            нужно
          </span>
        </div>
      </div>

      {/* Health banner */}
      {isSyncing && (
        <div className={`${styles.syncBanner} ${styles.syncBanner_syncing}`}>
          <span className={styles.bannerSpinner} />
          Синхронизация данных...
        </div>
      )}
      {!isSyncing && allSynced && (
        <div className={`${styles.syncBanner} ${styles.syncBanner_ok}`}>
          ✓ Все данные синхронизированы
        </div>
      )}
      {!isSyncing && anyMismatch && (
        <div className={`${styles.syncBanner} ${styles.syncBanner_warn}`}>
          ⚠ Синхронизация не завершена
        </div>
      )}

      {ENTITY_GROUPS.map((group) => (
        <div key={group.key}>
          <div className={styles.groupLabel}>{group.title}</div>
          {group.items.map((item) => {
            const local = localCounts[item.name] ?? 0;
            const server = serverCounts?.[item.name];
            const synced = item.hasServer && server != null && local === server && local > 0;
            const mismatch = item.hasServer && server != null && local !== server;
            const progress = item.hasServer && server && server > 0
              ? Math.min(local / server, 1)
              : local > 0 ? 1 : 0;
            const colState = syncProgress[item.name];

            return (
              <div
                key={item.name}
                className={[
                  styles.collectionRow,
                  synced ? styles.collectionRow_synced : '',
                  mismatch && !isSyncing ? styles.collectionRow_mismatch : '',
                  colState === 'syncing' ? styles.collectionRow_syncing : '',
                ].join(' ')}
              >
                <div className={styles.rowIndicator} />
                <div className={styles.rowName}>
                  {item.label}
                  <CollectionStateIcon state={colState} />
                </div>
                <div className={styles.rowRight}>
                  {item.hasServer ? (
                    <>
                      <div className={styles.rowCounts}>
                        <span className={styles.rowLocal}>
                          {loading ? '…' : fmt(local)}
                        </span>
                        <span className={styles.rowSep}>/</span>
                        <span className={styles.rowServer}>
                          {loading ? '…' : (server != null ? fmt(server) : '—')}
                        </span>
                      </div>
                      <div className={styles.rowProgress}>
                        <div
                          className={styles.rowProgressFill}
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <span className={styles.rowCountSingle}>
                      {loading ? '…' : fmt(local)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Sync Tab ───

function SyncTab() {
  const [connection, setConnection] = useState<ConnectionStatus>(triplit.connectionStatus);
  const [localCounts, setLocalCounts] = useState<Counts>({});
  const [serverCounts, setServerCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatusState] = useState<SyncStatus>(() => getSyncStatus());
  const [syncProgress, setSyncProgressState] = useState<SyncProgress>(() => getSyncProgress());
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    getSyncLog().map((e: SyncLogEntry) => ({ time: e.time, level: e.level, message: `[sync] ${e.message}` })),
  );
  const [sessionInfo, setSessionInfo] = useState(() => getSessionInfo());
  const [serverUrl] = useState(() => (triplit as { serverUrl?: string }).serverUrl ?? 'unknown');
  const [tokenLabel] = useState(() => {
    const t = triplit.token;
    if (!t) return 'none';
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload.sub ? `user: ${payload.sub}` : 'anon';
    } catch { return 'invalid'; }
  });
  const logBoxRef = useRef<HTMLDivElement>(null);

  const isSyncing = syncStatus === 'syncing';

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    setLogs((prev) => [...prev.slice(-99), { time: now(), level, message }]);
  }, []);

  const fetchCounts = useCallback(async () => {
    setLoading(true);

    const [idbResults, serverData] = await Promise.all([
      Promise.allSettled(
        ALL_COLLECTIONS.map(async (name) => {
          const count = await countLocal(name);
          return { name, count };
        }),
      ),
      fetch(`${API_BASE}/api/system/counts`, { signal: AbortSignal.timeout(4_000) })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    const next: Counts = {};
    let errors = 0;
    for (const result of idbResults) {
      if (result.status === 'fulfilled') {
        next[result.value.name] = result.value.count;
      } else {
        const name = ALL_COLLECTIONS[idbResults.indexOf(result)];
        next[name] = null;
        errors++;
      }
    }

    setLocalCounts(next);
    setServerCounts(serverData ?? null);
    setLoading(false);
    if (errors > 0) addLog('warn', `${errors} collection(s) failed to count.`);
    addLog('info', serverData ? 'Counts refreshed.' : 'Counts refreshed (server unreachable).');
  }, [addLog]);

  useEffect(() => {
    let lastLength = getSyncLog().length;
    return onSyncLogChange((entries) => {
      const newEntries = entries.slice(lastLength);
      lastLength = entries.length;
      if (newEntries.length > 0) {
        setLogs((prev) => [
          ...prev,
          ...newEntries.map((e) => ({ time: e.time, level: e.level, message: `[sync] ${e.message}` })),
        ]);
      }
    });
  }, []);

  useEffect(() => {
    return onSyncStatusChange((status) => {
      setSyncStatusState(status);
      setSessionInfo(getSessionInfo());
      if (status === 'synced') fetchCounts();
    });
  }, [fetchCounts]);

  useEffect(() => {
    return onSyncProgressChange((progress) => {
      setSyncProgressState(progress);
    });
  }, []);

  useEffect(() => {
    return triplit.onConnectionStatusChange((status) => {
      setConnection(status);
      setSessionInfo(getSessionInfo());
      addLog('info', `Connection: ${status}`);
    }, true);
  }, [addLog]);

  useEffect(() => {
    const logBox = logBoxRef.current;
    if (logBox) logBox.scrollTop = logBox.scrollHeight;
  }, [logs]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleReconnect = useCallback(async () => {
    try {
      await triplit.endSession();
      const savedToken = localStorage.getItem('triplit_token');
      const anonToken = import.meta.env.VITE_TRIPLIT_TOKEN;
      const token = savedToken ?? anonToken;
      if (token) {
        await triplit.startSession(token);
        const label = savedToken ? 'user token' : 'anon token';
        addLog('info', `Reconnected with ${label}.`);
      } else {
        addLog('warn', 'No token available.');
      }
      setSessionInfo(getSessionInfo());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog('error', `Reconnect failed: ${msg}`);
    }
  }, [addLog]);

  return (
    <>
      {/* Progress bar */}
      <div className={styles.progressBar}>
        {(loading || isSyncing) && <div className={styles.progressIndeterminate} />}
      </div>

      <div className={styles.tabContent}>
        {/* Data card */}
        <DataCard
          localCounts={localCounts}
          serverCounts={serverCounts}
          loading={loading}
          syncProgress={syncProgress}
          isSyncing={isSyncing}
        />

        {/* Session card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Сессия</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Режим</span>
            <span className={styles.infoValue}>{sessionInfo.mode}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Соединение</span>
            <span className={styles.infoValue}>{connectionLabel[connection]}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Токен</span>
            <span className={styles.infoValue}>{tokenLabel}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Сервер</span>
            <span className={styles.infoValue}>{serverUrl}</span>
          </div>
          {sessionInfo.skippedReason && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Причина</span>
              <span className={styles.infoValue}>{sessionInfo.skippedReason}</span>
            </div>
          )}
          <div className={styles.cardActions}>
            <Button variant="secondary" onClick={handleReconnect}>Переподключить</Button>
            <Button variant="secondary" onClick={fetchCounts} isLoading={loading}>Обновить</Button>
          </div>
        </div>

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

        {/* Logs card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Логи</span>
          </div>
          <div className={styles.logBox} ref={logBoxRef}>
            {logs.length === 0 && <span className={styles.logEmpty}>Нет записей.</span>}
            {logs.map((log, i) => (
              <div key={i} className={`${styles.logLine} ${styles[`log_${log.level}`]}`}>
                <span className={styles.logTime}>{log.time}</span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
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
  const knownDBs = ['triplit', 'triplit-cache', 'triplit-outbox', 'triplit-metadata', 'disher-reference'];
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
          Приложение перезагрузится и синхронизируется с сервером заново.
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
  const [tab, setTab] = useState('sync');

  // Compute chip state from triplit connection
  const [connection, setConnection] = useState<ConnectionStatus>(triplit.connectionStatus);
  useEffect(() => {
    return triplit.onConnectionStatusChange((s) => setConnection(s), true);
  }, []);

  const chipLevel = connection === 'OPEN' ? 'success'
    : connection === 'CONNECTING' ? 'loading'
    : 'idle';
  const chipMsg = connectionLabel[connection];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>System</h1>
        <div className={`${styles.statusChip} ${styles[`statusChip_${chipLevel}`]}`}>
          <span className={styles.statusDot} />
          {chipMsg}
        </div>
      </header>

      <div className={styles.tabsWrap}>
        <Tabs tabs={TABS} current={tab} setTab={setTab} />
      </div>

      {tab === 'sync' && <SyncTab />}
      {tab === 'reset' && <ResetTab />}
    </div>
  );
};

export default SystemPage;
