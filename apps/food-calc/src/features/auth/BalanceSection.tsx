import { useEffect, useState } from 'react';
import styles from './BalanceSection.module.scss';
import { fetchBalance, fetchLedger, type LedgerEntry } from '@/shared/lib/api/billing';

// Balance + recent transactions, shown in the ProfileDrawer. Fetched fresh each
// time the drawer opens (balance only changes on spend/top-up — no live bus).

const rub = (kop: number) =>
  (kop / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 });

const KIND_LABEL: Record<LedgerEntry['kind'], string> = {
  grant: 'Начисление',
  topup: 'Пополнение',
  charge: 'Списание',
  refund: 'Возврат',
};

const FEATURE_LABEL: Record<string, string> = {
  free_text_parse: 'Разбор еды',
  dish_suggestions: 'Подсказка рецепта',
  nutrient_suggestions: 'Подсказка нутриентов',
  daily_analysis: 'Анализ дня',
  dish_analysis: 'Анализ блюда',
  long_analysis: 'Длинный анализ',
};

function entryLabel(e: LedgerEntry): string {
  if (e.feature) return FEATURE_LABEL[e.feature] ?? e.feature;
  return KIND_LABEL[e.kind];
}

export function BalanceSection() {
  const [balanceKop, setBalanceKop] = useState<number | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        const [b, l] = await Promise.all([
          fetchBalance(ac.signal),
          fetchLedger(8, ac.signal),
        ]);
        setBalanceKop(b.balanceKop);
        setLedger(l);
      } catch {
        if (!ac.signal.aborted) setFailed(true);
      }
    })();
    return () => ac.abort();
  }, []);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionLabel}>Баланс</h2>

      {failed ? (
        <p className={styles.hint}>Не удалось загрузить баланс</p>
      ) : (
        <>
          <p className={styles.value}>
            {balanceKop === null ? '…' : `${rub(balanceKop)} ₽`}
          </p>
          <p className={styles.hint}>
            Списывается за запросы к ИИ — разбор еды и анализы. Пополнение пока
            вручную.
          </p>
          <button type="button" className={styles.topupBtn} disabled>
            Пополнить — скоро
          </button>

          {ledger.length > 0 && (
            <ul className={styles.ledger}>
              {ledger.map((e) => (
                <li key={e.id} className={styles.ledgerRow}>
                  <span className={styles.ledgerLabel}>{entryLabel(e)}</span>
                  <span className={styles.ledgerAmount}>
                    {e.amountKop > 0 ? '+' : '−'}
                    {rub(Math.abs(e.amountKop))} ₽
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
