import { memo, useState, type ReactNode } from 'react';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import clsx from 'clsx';
import type { InsightValence, InsightStrength, InsightEvidence } from '@/entities/insight';
import { Button } from '@/shared/ui/atoms/Button';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './ObservationCard.module.scss';

export type ObservationAction = 'none' | 'add';

// Unified card for the three analysis-output entities (merged 2026-06-25, plan
// Slice 8 — was HypothesisCard + InsightCard):
//   • observation — neutral pattern, read-only reference (action='none'). Has
//                   strength + evidence, NO valence sign.
//   • insight     — good/bad takeaway. Same as observation + a monochrome ±
//                   valence sign; addable (action='add') in a result, deletable
//                   (action='delete') on the saved-insights page.
//   • hypothesis  — testable experiment: title + detail(body) + a «проверить ~N
//                   дн.» caption, addable (action='add'). No valence/strength/
//                   evidence (they're simply not passed → not rendered).
// The card stays entity-agnostic: persistence + copy ride in via props (`onAdd`
// + the add* labels). Layout — text column; the «+ к себе» CTA (Button accent,
// reduced) pins bottom-right inside the text. Deletion of a saved insight is NOT
// a card affordance anymore (Slice 3, 2026-06-26): it moved to a long-press on
// the row + ConfirmDrawer, owned by the consumer (InsightListPanel).
type Props = {
  title: string;
  detail?: string;
  /** Caption right of the title — «проверить ~N дн.» (hypothesis). Overridden by
   *  the strength label when `strength` is supplied (insight/observation). */
  caption?: ReactNode;
  /** Insight valence → a quiet monochrome ＋/− before the title. Omitted /
   *  'neutral' → no glyph (observations & hypotheses pass nothing). */
  valence?: InsightValence;
  /** Confidence → a quiet caption («слабая связь» / «есть связь»). 'clear' and
   *  omitted render nothing (a label on every card is noise). */
  strength?: InsightStrength;
  /** Grounding chips (день / еда / событие). Omitted → none (hypotheses). */
  evidence?: InsightEvidence;
  /** Daily analysis hides the always-«сегодня» day-chip; long analysis keeps it. */
  showDays?: boolean;
  action?: ObservationAction;
  /** action='add': raw persistence (saveInsight / saveHypothesis). */
  onAdd?: () => Promise<void>;
  /**
   * Внутренние отступы карточки. По умолчанию ВЫКЛ (карточка прижата к краям
   * своего контейнера — SheetCard сам даёт воздух). Включить там, где карточка
   * стоит на голой поверхности и ей нужны собственные поля.
   */
  padded?: boolean;
  addLabel?: string;
  addedAriaLabel?: string;
  addSuccessToast?: string;
  addErrorToast?: string;
};

// How sure the model is the pattern is real. Shown ONLY when it's not «явная»:
// a label repeated identically on every card is noise.
const STRENGTH_LABEL: Partial<Record<InsightStrength, string>> = {
  weak: 'слабая связь',
  moderate: 'есть связь',
};

// Valence shown WITHOUT colour (F3 minimalism): a quiet monochrome ＋/− glyph
// before the title. Neutral renders no glyph.
const VALENCE_SIGN: Record<InsightValence, string> = {
  positive: '+',
  negative: '−',
  neutral: '',
};

// Backend day strings are `dd-MM-yyyy`. Humanise to «13 июня» (ru); fall back to
// the raw string if it isn't that shape.
function formatDay(day: string): string {
  const parsed = parse(day, 'dd-MM-yyyy', new Date());
  return isValid(parsed) ? format(parsed, 'd MMMM', { locale: ru }) : day;
}

const ObservationCard = ({
  title,
  detail,
  caption,
  valence,
  strength,
  evidence,
  showDays = true,
  action = 'none',
  onAdd,
  padded = false,
  addLabel = 'Добавить себе',
  addedAriaLabel = 'Сохранено',
  addSuccessToast = 'Сохранено',
  addErrorToast = 'Не удалось сохранить',
}: Props) => {
  const sign = valence ? VALENCE_SIGN[valence] : '';
  const strengthLabel = strength ? STRENGTH_LABEL[strength] : undefined;
  const headCaption = strengthLabel ?? caption;

  const days = showDays ? (evidence?.days ?? []) : [];
  const foods = evidence?.foods ?? [];
  const events = evidence?.events ?? [];
  const hasEvidence = days.length + foods.length + events.length > 0;

  const [added, setAdded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (added || saving || !onAdd) return;
    setSaving(true);
    try {
      await onAdd();
      setAdded(true);
      toast.success(addSuccessToast);
    } catch (err) {
      console.error('save observation failed', err);
      toast.error(addErrorToast);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      className={clsx(styles.card, padded && styles.padded)}
      data-strength={strength || undefined}
      data-valence={valence || undefined}
    >
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
          {headCaption && (
            <Text as="span" role="caption" className={styles.caption}>
              {headCaption}
            </Text>
          )}
        </div>

        {detail && (
          <Text role="body" className={styles.detail}>
            {detail}
          </Text>
        )}

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
          // Уменьшенный accent-CTA (класс .add режет min-height/padding с
          // дефолтных 56px). Без ведущей иконки — текст «Добавить себе» несёт
          // действие сам. Сохранено → soft-ярус (accent-secondary) «✓ сохранено».
          <Button
            variant={added ? 'accent-secondary' : 'accent'}
            className={styles.add}
            onClick={handleAdd}
            disabled={added || saving}
            aria-label={added ? addedAriaLabel : addLabel}
          >
            {added ? '✓ сохранено' : addLabel}
          </Button>
        )}
      </div>
    </article>
  );
};

export default memo(ObservationCard);
