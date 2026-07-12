import { useCallback, useEffect, useState } from 'react';
import styles from './BalanceSection.module.scss';
import { fetchBalance, fetchLedger, type LedgerEntry } from '@/shared/lib/api/billing';
import { Text, Numeral } from '@/shared/ui/atoms/Typography';
import { rub } from '@/shared/lib/money';

// Balance + recent transactions, shown in the ProfileDrawer. Fetched fresh each
// time the drawer opens (balance only changes on spend/top-up — no live bus).
// The ₽ formatter (`rub`) lives in shared/lib/money — the same one the admin
// top-up panel uses, so a kopeck renders identically everywhere.

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

  // Reusable fetch so the failed-state retry re-runs the exact same load. No
  // AbortSignal on a manual retry (there's no unmount race — the drawer stays
  // open); the mount effect passes one so a fast close doesn't set state.
  const load = useCallback(async (signal?: AbortSignal) => {
    setFailed(false);
    try {
      const [b, l] = await Promise.all([
        fetchBalance(signal),
        fetchLedger(8, signal),
      ]);
      setBalanceKop(b.balanceKop);
      setLedger(l);
    } catch {
      if (!signal?.aborted) setFailed(true);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void load(ac.signal);
    return () => ac.abort();
  }, [load]);

  return (
    <section className={styles.section}>
      <Text as="h2" role="label" className={styles.sectionLabel}>Баланс</Text>

      {failed ? (
        // Ошибка баланса — не тупик: человекочитаемая строка + inline-retry
        // (2026-канон / NN/G: мёртвый текст ошибки без действия вреден).
        <div className={styles.errorRow}>
          <Text as="span" role="caption" className={styles.hint}>Баланс недоступен</Text>
          <button type="button" className={styles.retry} onClick={() => void load()}>
            <Text as="span" role="label">Обновить</Text>
          </button>
        </div>
      ) : (
        <>
          <Numeral as="p" size="display" weight="bold" className={styles.value}>
            {balanceKop === null ? '…' : `${rub(balanceKop)} ₽`}
          </Numeral>
          <Text as="p" role="caption" className={styles.hint}>
            Списывается за запросы к ИИ — разбор еды и анализы.
          </Text>
          {/* Пополнение пока вручную — тихая строка-подпись, НЕ мёртвая disabled-CTA
              (NN/G: disabled-only CTA вводит в заблуждение). */}
          <Text as="p" role="caption" className={styles.comingSoon}>
            Пополнение — скоро
          </Text>

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
