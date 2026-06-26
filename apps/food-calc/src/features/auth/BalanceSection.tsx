import { useEffect, useState } from 'react';
import styles from './BalanceSection.module.scss';
import { fetchBalance, fetchLedger, type LedgerEntry } from '@/shared/lib/api/billing';
import { Text, Numeral } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';

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
      <Text as="h2" role="label" className={styles.sectionLabel}>Баланс</Text>

      {failed ? (
        <Text as="p" role="caption" className={styles.hint}>Не удалось загрузить баланс</Text>
      ) : (
        <>
          <Numeral as="p" size="display" weight="bold" className={styles.value}>
            {balanceKop === null ? '…' : `${rub(balanceKop)} ₽`}
          </Numeral>
          <Text as="p" role="caption" className={styles.hint}>
            Списывается за запросы к ИИ — разбор еды и анализы. Пополнение пока
            вручную.
          </Text>
          <Button variant="system-secondary" disabled fullWidth>
            Пополнить — скоро
          </Button>

          {ledger.length > 0 && (
            <ul className={styles.ledger}>
              {ledger.map((e) => (
                <li key={e.id} className={styles.ledgerRow}>
                  <Text as="span" role="caption" className={styles.ledgerLabel}>{entryLabel(e)}</Text>
                  <Numeral as="span" size="sm" className={styles.ledgerAmount}>
                    {e.amountKop > 0 ? '+' : '−'}
                    {rub(Math.abs(e.amountKop))} ₽
                  </Numeral>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
