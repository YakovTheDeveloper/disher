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
import PlusIcon from '@/shared/assets/icons/plus.svg?react';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './InsightCard.module.scss';

export type InsightCardAction = 'none' | 'add' | 'delete';

type Props = {
  insight: InsightCore;
  /** Daily analysis = single window day → the day-chip is tautological («все
   *  сегодня»), so it's hidden. Long analysis (multi-day window) keeps it. */
  showDays?: boolean;
  /**
   * 'add'    — result view: «Добавить к себе» saves into the user's insight list.
   * 'delete' — saved-insights page: a quiet chevron (bottom-right) triggers the
   *            parent's onDelete (which gates it behind a confirm Drawer).
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

// Valence shown WITHOUT colour (F3 minimalism): a quiet monochrome ＋/− glyph
// before the title (baked 2026-06-22 — the 'label'/'plain' DesignBar forks were
// dropped, 'sign' was the live default). Neutral renders no glyph.
const VALENCE_SIGN: Record<InsightValence, string> = {
  positive: '+',
  negative: '−',
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
          <Heading as="h3" role="title" className={styles.cardTitle}>
            {sign && (
              <span className={styles.valenceSign} aria-hidden>
                {sign}
              </span>
            )}
            {title}
          </Heading>
          {strengthLabel && (
            <Text as="span" role="caption" className={styles.strength}>
              {strengthLabel}
            </Text>
          )}
        </div>
        <Text role="body" className={styles.detail}>
          {detail}
        </Text>
        {hasEvidence && (
          <div className={styles.evidence}>
            {days.map((d) => (
              <Text as="span" role="caption" key={`d-${d}`} className={styles.chipDay}>
                {formatDay(d)}
              </Text>
            ))}
            {foods.map((f) => (
              <Text as="span" role="caption" key={`f-${f}`} className={styles.chipFood}>
                {f}
              </Text>
            ))}
            {events.map((e) => (
              <Text as="span" role="caption" key={`e-${e}`} className={styles.chipEvent}>
                {e}
              </Text>
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
              <Text as="span" role="caption">✓ сохранено</Text>
            ) : (
              <>
                <PlusIcon aria-hidden />
                <Text as="span" role="caption">Сохранить инсайт</Text>
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
          <ChevronGlyph />
        </button>
      )}
    </article>
  );
};

export default memo(InsightCard);
