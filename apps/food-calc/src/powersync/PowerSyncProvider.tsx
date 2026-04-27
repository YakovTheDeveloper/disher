import { PowerSyncContext } from '@powersync/react';
import { useEffect, useState, type ReactNode } from 'react';
import { SyncStreamConnectionMethod } from '@powersync/web';

import { SupabaseConnector } from './connector';
import { db } from './database';
import { supabase } from './supabase-client';

// ─── DEV WIPE BUTTON (закомментируй блок чтобы убрать) ───────────────────
// Императивно создаёт fixed-кнопку справа сверху, которая ставит флаг
// и перезагружает страницу. Эквивалент:
//   localStorage.setItem('disher:wipe', '1'); location.reload();
// if (typeof window !== 'undefined' && !document.getElementById('disher-wipe-btn')) {
//   const mount = () => {
//     if (document.getElementById('disher-wipe-btn')) return;
//     const btn = document.createElement('button');
//     btn.id = 'disher-wipe-btn';
//     btn.textContent = 'WIPE';
//     btn.style.cssText = [
//       'position:fixed',
//       'top:8px',
//       'right:8px',
//       'z-index:2147483647',
//       'padding:6px 10px',
//       'font:600 12px/1 system-ui,sans-serif',
//       'color:#fff',
//       'background:#c0392b',
//       'border:none',
//       'border-radius:6px',
//       'box-shadow:0 2px 6px rgba(0,0,0,.25)',
//       'cursor:pointer',
//       'opacity:.85',
//     ].join(';');
//     btn.addEventListener('click', () => {
//       localStorage.setItem('disher:wipe', '1');
//       location.reload();
//     });
//     document.body.appendChild(btn);
//   };
//   if (document.body) mount();
//   else document.addEventListener('DOMContentLoaded', mount, { once: true });
// }
// ─────────────────────────────────────────────────────────────────────────

const connector = new SupabaseConnector();

type Props = { children: ReactNode };

export function PowerSyncProvider({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ─── DEV WIPE (одноразовый) ────────────────────────────────────────
        // Как использовать: открой DevTools Console и выполни:
        //
        //   localStorage.setItem('disher:wipe', '1'); location.reload();
        //
        // Один раз снесёт локальную PowerSync БД (включая застрявший
        // CRUD-queue с битыми записями), выкинет анонима и сам сбросит
        // флаг — следующая загрузка пойдёт нормально. Никакого риска
        // зацикливания и не нужно ничего комментировать.
        if (localStorage.getItem('disher:wipe') === '1') {
          localStorage.removeItem('disher:wipe');
          await db.disconnectAndClear().catch(() => {});
          await supabase.auth.signOut().catch(() => {});
          console.warn('[disher:wipe] local DB cleared, signed out');
        }
        // ───────────────────────────────────────────────────────────────────

        await db.init();

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          const { error: anonErr } = await supabase.auth.signInAnonymously();
          if (anonErr) throw anonErr;
        }

        // WebSocket transport: HTTP streaming hangs on iOS Safari
        // (chunks never delivered to ReadableStream until connection closes).
        await db.connect(connector, {
          connectionMethod: SyncStreamConnectionMethod.WEB_SOCKET,
        });

        if (!cancelled) setReady(true);
      } catch (err) {
        console.error('PowerSync bootstrap failed', err);
        if (!cancelled) setError(err as Error);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Force PowerSync to pick up the new access token without re-syncing.
        connector
          .fetchCredentials()
          .catch((e) => console.error('refresh fetchCredentials failed', e));
      }
      if (event === 'SIGNED_OUT') {
        db.disconnectAndClear().catch((e) => console.error('disconnectAndClear failed', e));
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: 24, color: 'red' }}>Failed to initialize sync: {error.message}</div>
    );
  }

  if (!ready) {
    return null;
  }

  return <PowerSyncContext.Provider value={db}>{children}</PowerSyncContext.Provider>;
}
