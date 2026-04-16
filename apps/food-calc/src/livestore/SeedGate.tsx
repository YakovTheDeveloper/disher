import { type ReactNode, useEffect, useState } from 'react';
import { useStore } from '@livestore/react';
import { isSeedNeeded, runSeed } from './seed';

interface SeedGateProps {
  children: ReactNode;
}

/**
 * Checks on mount whether the database needs seeding (first launch).
 * If yes — shows a progress bar, seeds products + daily norm, then renders children.
 * If no — renders children immediately.
 */
export function SeedGate({ children }: SeedGateProps) {
  const { store } = useStore();
  const [seedState] = useState(() => isSeedNeeded(store));
  const [seeding, setSeeding] = useState(seedState.needed);
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seeding) return;

    let cancelled = false;

    runSeed(store, (done, total) => {
      if (!cancelled) setProgress({ done, total });
    }, seedState.isReseed)
      .then(() => {
        if (!cancelled) setSeeding(false);
      })
      .catch((err) => {
        console.error('Seed failed:', err);
        if (!cancelled) setError(err.message ?? 'Unknown error');
      });

    return () => {
      cancelled = true;
    };
  }, [seeding, store]);

  if (!seeding) return <>{children}</>;

  const pct = Math.round((progress.done / progress.total) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        padding: '0 32px',
        fontFamily: 'system-ui, sans-serif',
        gap: 16,
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>
        {error ? 'Ошибка загрузки' : 'Загрузка базы продуктов...'}
      </p>

      {error ? (
        <>
          <p style={{ color: '#e53e3e', fontSize: 14, margin: 0, textAlign: 'center' }}>{error}</p>
          <button
            onClick={() => {
              setError(null);
              setProgress({ done: 0, total: 1 });
            }}
            style={{
              padding: '8px 24px',
              fontSize: 14,
              border: '1px solid #ccc',
              borderRadius: 8,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Повторить
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              height: 6,
              borderRadius: 3,
              background: '#eee',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: '#000',
                borderRadius: 3,
                transition: 'width 150ms ease-out',
              }}
            />
          </div>
          <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
            {progress.done} / {progress.total}
          </p>
        </>
      )}
    </div>
  );
}
