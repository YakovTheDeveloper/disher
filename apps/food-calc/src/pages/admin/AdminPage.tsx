import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { RouterLinks } from '@/app/router';
import { Screen } from '@/shared/ui/Screen';
import { Heading, Text, Numeral } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { drawerStore } from '@/shared/ui/drawer-store';
import { fetchAdminUsers, type AdminUser } from '@/shared/lib/api/admin';
import { rub } from '@/shared/lib/money';
import { useAdminGate } from '@/features/admin/useIsAdmin';
import { TopupDrawer } from '@/features/admin/TopupDrawer';
import { UserLedgerDrawer } from '@/features/admin/UserLedgerDrawer';
import styles from './AdminPage.module.scss';

// /admin — wallet top-up console. Client gate is UX only: `useIsAdmin` may be
// `false` (bounce to root — the server 403s the API regardless), `null` (still
// deciding / transient — render nothing) or `true` (show the list). Dozens of
// users, no pagination → fetch once, filter on the client.

export function AdminPage() {
  const { isAdmin, retry } = useAdminGate();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Only fetch once we know we're an admin — avoids a guaranteed 403 while the
    // probe is still deciding (isAdmin === null).
    if (isAdmin !== true) return;
    const ac = new AbortController();
    setFailed(false);
    fetchAdminUsers(ac.signal)
      .then(setUsers)
      .catch(() => {
        if (!ac.signal.aborted) setFailed(true);
      });
    return () => ac.abort();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.role ?? '').toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }, [users, query]);

  // Not an admin — leave. A direct-URL visitor lands here and gets bounced; the
  // API would 403 anyway. `null` = undecided (probe in flight) OR a transient
  // probe failure — show a loader with a retry so a network blip can't strand a
  // real admin on a blank page (the mount would otherwise stay null forever).
  if (isAdmin === false) return <Navigate to={RouterLinks.Root} replace />;
  if (isAdmin === null) {
    return (
      <div className={styles.gate}>
        <Text role="caption" as="p" className={styles.hint}>
          Проверяем доступ…
        </Text>
        <button type="button" className={styles.retry} onClick={retry}>
          <Text role="label" as="span">
            Повторить
          </Text>
        </button>
      </div>
    );
  }

  // Patch the one row on a successful top-up instead of refetching the whole
  // list — fired from the drawer's success callback (not its close value), so it
  // lands even when the drawer is later dismissed by swipe rather than «Закрыть».
  const patchBalance = (id: string, balanceKop: number) =>
    setUsers((prev) =>
      prev
        ? prev.map((x) => (x.id === id ? { ...x, balanceKop, hasWallet: true } : x))
        : prev,
    );

  const openTopup = (u: AdminUser) => {
    void drawerStore.show(TopupDrawer, {
      userId: u.id,
      email: u.email,
      onSuccess: (balanceKop: number) => patchBalance(u.id, balanceKop),
    });
  };

  const openLedger = (u: AdminUser) => {
    void drawerStore.show(UserLedgerDrawer, { userId: u.id, email: u.email });
  };

  return (
    <Screen
      backgroundColor="gray"
      header={
        <header className={styles.header}>
          <Heading role="headline" as="h1">
            Пользователи
          </Heading>
          <AutoGrowSearch
            singleLine
            value={query}
            onChange={setQuery}
            placeholder="Поиск по почте или роли"
            className={styles.search}
          />
        </header>
      }
    >
      <div className={styles.list}>
        {failed ? (
          <Text role="caption" as="p" className={styles.hint}>
            Не удалось загрузить пользователей
          </Text>
        ) : users === null ? (
          <Text role="caption" as="p" className={styles.hint}>
            …
          </Text>
        ) : filtered.length === 0 ? (
          <Text role="caption" as="p" className={styles.hint}>
            Никого не найдено
          </Text>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className={styles.row}>
              <div className={styles.identity}>
                <Text role="body" as="span" className={styles.email}>
                  {u.email ?? u.id}
                </Text>
                <Text role="caption" as="span" className={styles.role}>
                  {u.role ?? 'user'}
                </Text>
              </div>
              <Numeral as="span" size="sm" weight="bold" className={styles.balance}>
                {rub(u.balanceKop)} ₽
              </Numeral>
              <div className={styles.actions}>
                <Button variant="system-secondary" flat onClick={() => openTopup(u)}>
                  Начислить
                </Button>
                <Button variant="ghost" onClick={() => openLedger(u)}>
                  История
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Screen>
  );
}

export default AdminPage;
