import { memo, useState } from 'react';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  saveInsight,
  type InsightSource,
  type InsightCore,
  type InsightStrength,
  type InsightValence,
} from '@/entities/insight';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import PlusIcon from '@/shared/assets/icons/plus.svg?react';
import styles from './InsightCard.module.scss';

export type InsightCardAction = 'none' | 'add' | 'delete';

type Props = {
  insight: InsightCore;
  /** Daily analysis = single window day → the day-chip is tautological («все
   *  сегодня»), so it's hidden. Long analysis (multi-day window) keeps it. */
  showDays?: boolean;
  /**
   * 'add'    — result view: «Добавить к себе» saves into the user's insight list.
   * 'delete' — saved-insights page: a quiet ✕ removes it (parent owns onDelete).
   * 'none'   — read-only (default), no action.
   */
  action?: InsightCardAction;
  /** Which разбор produced this insight — recorded on save (action='add'). */
  source?: InsightSource;
  /** Remove handler — required for action='delete'. */
  onDelete?: () => void;
};

// How sure the model is the pattern is real. Shown ONLY when it's not «явная»:
// a label repeated identically on every card is noise.
const STRENGTH_LABEL: Partial<Record<InsightStrength, string>> = {
  weak: 'слабая связь',
  moderate: 'есть связь',
};

// Valence shown WITHOUT colour (F3 minimalism). Two minimal monochrome modes,
// flipped by the 'Insight' design-variant on an ancestor (set in AnalysisResult
// / InsightListPanel): default 'sign' shows a ＋/− glyph; 'label' shows a quiet
// word; 'plain' shows neither. Both spans render; CSS picks which is visible.
const VALENCE_SIGN: Record<InsightValence, string> = {
  positive: '+',
  negative: '−',
  neutral: '',
};
const VALENCE_LABEL: Record<InsightValence, string> = {
  positive: 'синергия',
  negative: 'осторожно',
  neutral: '',
};

// Backend day strings are `dd-MM-yyyy`. Humanise to «13 июня» (ru) to match the
// rest of the app; fall back to the raw string if it isn't that shape.
function formatDay(day: string): string {
  const parsed = parse(day, 'dd-MM-yyyy', new Date());
  return isValid(parsed) ? format(parsed, 'd MMMM', { locale: ru }) : day;
}

// One insight = one observation grounded in evidence. In a result it's addable
// («Добавить к себе» → saveInsight); on the saved page it's deletable. Valence
// (good/bad) reads off a monochrome sign or word — never a hue. The evidence row
// is the point: a fabricated pattern has nowhere to hide.
const InsightCard = ({
  insight,
  showDays = true,
  action = 'none',
  source = 'daily',
  onDelete,
}: Props) => {
  const { title, detail, valence, strength, evidence } = insight;
  const strengthLabel = STRENGTH_LABEL[strength];
  const sign = VALENCE_SIGN[valence];
  const valenceLabel = VALENCE_LABEL[valence];
  const days = showDays ? evidence.days : [];
  const foods = evidence.foods ?? [];
  const events = evidence.events ?? [];
  const hasEvidence = days.length + foods.length + events.length > 0;

  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (added || saving) return;
    setSaving(true);
    try {
      await saveInsight({ title, detail, valence, strength, evidence, source });
      setAdded(true);
      toast.success('Инсайт сохранён');
    } catch (err) {
      console.error('save insight failed', err);
      toast.error('Не удалось добавить инсайт');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={styles.card} data-strength={strength} data-valence={valence}>
      <div className={styles.text}>
        <div className={styles.head}>
          <h3 className={styles.title}>
            {sign && (
              <span className={styles.valenceSign} aria-hidden>
                {sign}
              </span>
            )}
            {title}
          </h3>
          {valenceLabel && <span className={styles.valenceLabel}>{valenceLabel}</span>}
          {strengthLabel && <span className={styles.strength}>{strengthLabel}</span>}
        </div>
        <p className={styles.detail}>{detail}</p>
        {hasEvidence && (
          <div className={styles.evidence}>
            {days.map((d) => (
              <span key={`d-${d}`} className={styles.chipDay}>
                {formatDay(d)}
              </span>
            ))}
            {foods.map((f) => (
              <span key={`f-${f}`} className={styles.chipFood}>
                {f}
              </span>
            ))}
            {events.map((e) => (
              <span key={`e-${e}`} className={styles.chipEvent}>
                {e}
              </span>
            ))}
          </div>
        )}
        {action === 'add' && (
          <button
            type="button"
            className={styles.add}
            onClick={handleAdd}
            disabled={added || saving}
            data-added={added || undefined}
            aria-label={added ? 'Инсайт сохранён' : 'Сохранить инсайт'}
          >
            {added ? (
              '✓ сохранено'
            ) : (
              <>
                <PlusIcon aria-hidden />Сохранить инсайт
              </>
            )}
          </button>
        )}
      </div>
      {action === 'delete' && (
        <button
          type="button"
          className={styles.delete}
          onClick={onDelete}
          aria-label="Удалить инсайт"
        >
          <CrossIcon />
        </button>
      )}
    </article>
  );
};

export default memo(InsightCard);
