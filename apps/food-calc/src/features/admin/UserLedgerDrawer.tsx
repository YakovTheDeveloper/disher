import { useEffect, useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Text, Numeral } from '@/shared/ui/atoms/Typography';
import { fetchUserLedger, type AdminLedgerRow } from '@/shared/lib/api/admin';
import { rub } from '@/shared/lib/money';
import s from './UserLedgerDrawer.module.scss';

// Read-only ledger for one user — the audit trail for top-ups (meta.reason) and
// AI spend. The admin ledger route includes `meta`, so a top-up's reason shows.

const KIND_LABEL: Record<string, string> = {
  grant: 'Начисление',
  topup: 'Пополнение',
  charge: 'Списание',
  refund: 'Возврат',
};

function reasonOf(row: AdminLedgerRow): string | null {
  const r = row.meta?.reason;
  return typeof r === 'string' ? r : null;
}

type Props = BaseDrawerProps & {
  userId: string;
  email: string | null;
};

export function UserLedgerDrawer({ userId, email }: Props) {
  const [rows, setRows] = useState<AdminLedgerRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setFailed(false);
    fetchUserLedger(userId, 50, ac.signal)
      .then(setRows)
      .catch(() => {
        if (!ac.signal.aborted) setFailed(true);
      });
    return () => ac.abort();
  }, [userId]);

  return (
    <DrawerLayout title="История" subtitle={email ?? undefined}>
      <div className={s.body}>
        {failed ? (
          <Text role="caption" as="p" className={s.hint}>
            История недоступна
          </Text>
        ) : rows === null ? (
          <Text role="caption" as="p" className={s.hint}>
            …
          </Text>
        ) : rows.length === 0 ? (
          <Text role="caption" as="p" className={s.hint}>
            Пока нет операций
          </Text>
        ) : (
          <ul className={s.list}>
            {rows.map((row) => {
              const reason = reasonOf(row);
              return (
                <li key={row.id} className={s.row}>
                  <span className={s.main}>
                    <Text role="body" as="span" className={s.kind}>
                      {KIND_LABEL[row.kind] ?? row.kind}
                    </Text>
                    {reason && (
                      <Text role="caption" as="span" className={s.reason}>
                        {reason}
                      </Text>
                    )}
                  </span>
                  <Numeral as="span" size="sm" className={s.amount}>
                    {row.amountKop > 0 ? '+' : '−'}
                    {rub(Math.abs(row.amountKop))} ₽
                  </Numeral>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DrawerLayout>
  );
}

export default UserLedgerDrawer;
