import type { NutrientTotals } from '@/shared/lib/nutrients';
import s from './AppBottomBar.module.scss';

type Props = {
  totals: NutrientTotals;
  onClick: () => void;
};

const fmt = (v: number | undefined) => (v == null ? '—' : String(Math.round(v)));

// Leading slot for AppBottomBar: 2-line gray macros + kcal/water summary.
// Fiber reads greenish, water blue — colour replaces the textual labels.
// Tap opens a nutrients drawer wired by the consumer.
export const NutrientsSummaryButton = ({ totals, onClick }: Props) => {
  const protein = fmt(totals['1']);
  const fat = fmt(totals['2']);
  const carbs = fmt(totals['3']);
  const fiber = fmt(totals['6']);
  const kcal = fmt(totals['7']);
  const water = fmt(totals['8']);
  return (
    <button
      type="button"
      className={s.nutrientsBtn}
      onClick={onClick}
      aria-label="Открыть нутриенты"
    >
      <span className={s.nutrientsMacros}>
        <span>{protein}</span>
        <span className={s.dot}>•</span>
        <span>{fat}</span>
        <span className={s.dot}>•</span>
        <span>{carbs}</span>
        <span className={s.dot}>•</span>
        <span className={s.fiber}>{fiber}</span>
      </span>
      <span className={s.nutrientsLine}>
        <span>{`${kcal} ккал`}</span>
        <span className={s.water}>{`${water} мл`}</span>
      </span>
    </button>
  );
};

export default NutrientsSummaryButton;
