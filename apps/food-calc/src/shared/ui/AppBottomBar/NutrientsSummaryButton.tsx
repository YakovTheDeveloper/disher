import type { NutrientTotals } from '@/shared/lib/nutrients';
import s from './AppBottomBar.module.scss';

type Props = {
  totals: NutrientTotals;
  onClick: () => void;
};

const fmt = (v: number | undefined) => (v == null ? '—' : String(Math.round(v)));

// Leading slot for AppBottomBar: 2-line gray macros + kcal summary.
// Tap opens a nutrients drawer wired by the consumer.
export const NutrientsSummaryButton = ({ totals, onClick }: Props) => {
  const protein = fmt(totals['1']);
  const fat = fmt(totals['2']);
  const carbs = fmt(totals['3']);
  const fiber = fmt(totals['6']);
  const kcal = fmt(totals['7']);
  return (
    <button
      type="button"
      className={s.nutrientsBtn}
      onClick={onClick}
      aria-label="Открыть нутриенты"
    >
      <span className={s.nutrientsLine}>{`${protein}/${fat}/${carbs}/${fiber}`}</span>
      <span className={s.nutrientsLine}>{`${kcal} ккал`}</span>
    </button>
  );
};

export default NutrientsSummaryButton;
