import { useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading, Text, Numeral } from '@/shared/ui/atoms/Typography';
import { Button } from '@/shared/ui/atoms/Button';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { topupUser, type TopupResult } from '@/shared/lib/api/admin';
import { rub, rubToKop } from '@/shared/lib/money';
import s from './TopupDrawer.module.scss';

// Manual wallet top-up. Amount is entered in whole ₽ (NumberInput is integer-
// only) and converted to integer kopecks at the boundary via rubToKop. A reason
// is required (it lands in the ledger row's meta.reason — the audit trail). No
// upper limit and no confirm step by product decision; the ONLY guard against a
// double-submit is the idempotency requestId below.
//
// Opened fresh per drawerStore.show, so `requestId` (minted once with the lazy
// useState initializer) is stable for this drawer's whole life — across
// re-renders AND across a retry of the same form. Reusing it makes the server
// dedup a repeated submit (alreadyApplied: true) instead of crediting twice.
// Patches the list via `onSuccess` at credit time — NOT via the close value —
// so the row updates even when the drawer is dismissed by swipe (which resolves
// the drawer promise with `undefined`) rather than the «Закрыть» button.

type Props = BaseDrawerProps & {
  userId: string;
  email: string | null;
  onSuccess?: (balanceKop: number) => void;
};

export function TopupDrawer({ userId, email, onClose, onSuccess }: Props) {
  const [rubValue, setRubValue] = useState(0);
  const [reason, setReason] = useState('');
  const [requestId] = useState(() => crypto.randomUUID());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TopupResult | null>(null);

  const amountKop = rubToKop(rubValue);
  const trimmedReason = reason.trim();
  const canSubmit = amountKop > 0 && trimmedReason.length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await topupUser(userId, { amountKop, reason: trimmedReason, requestId });
      setResult(res);
      // Patch the list now, at credit time — independent of how the drawer closes.
      onSuccess?.(res.balanceKop);
    } catch (e) {
      // Admin errors arrive as a flat { error } string → ApiResponseError.message.
      setError(e instanceof Error ? e.message : 'Не удалось начислить');
    } finally {
      setSubmitting(false);
    }
  };

  // Success view — the new balance, plus an «уже начислено» note when the request
  // was a dedup (double-tap / retry). Closing hands the balance back to the list.
  if (result) {
    return (
      <DrawerLayout title="Начисление">
        <div className={s.body}>
          <Heading role="headline" as="h3" className={s.centered}>
            Готово
          </Heading>
          <Text role="caption" as="p" className={s.centered}>
            {email ?? userId}
          </Text>
          <Numeral as="p" size="display" weight="bold" className={s.balance}>
            {rub(result.balanceKop)} ₽
          </Numeral>
          {result.alreadyApplied && (
            <Text role="caption" as="p" className={s.note}>
              Уже начислено — повтор запроса не добавил вторую сумму.
            </Text>
          )}
          <Button variant="system" fullWidth onClick={() => onClose()}>
            Закрыть
          </Button>
        </div>
      </DrawerLayout>
    );
  }

  return (
    <DrawerLayout title="Начислить" subtitle={email ?? undefined}>
      <div className={s.body}>
        <label className={s.field}>
          <Text role="label" as="span" className={s.fieldLabel}>
            Сумма, ₽
          </Text>
          <NumberInput value={rubValue} onChange={setRubValue} placeholder="0" size="big" autoFocus />
        </label>

        <label className={s.field}>
          <Text role="label" as="span" className={s.fieldLabel}>
            Причина
          </Text>
          <AutoGrowSearch
            singleLine
            value={reason}
            onChange={setReason}
            placeholder="За что начисление"
            maxLength={200}
          />
        </label>

        {error && (
          <Text role="caption" as="p" className={s.error}>
            {error}
          </Text>
        )}

        <Button
          variant="system"
          fullWidth
          disabled={!canSubmit}
          isLoading={submitting}
          onClick={handleSubmit}
        >
          {amountKop > 0 ? `Начислить ${rub(amountKop)} ₽` : 'Начислить'}
        </Button>
      </div>
    </DrawerLayout>
  );
}

export default TopupDrawer;
