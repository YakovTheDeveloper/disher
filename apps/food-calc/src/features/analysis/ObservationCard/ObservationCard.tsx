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
// + the add* labels). Layout — flat row inside a section group-plate (the cool
// proposal-wash lives on the container, not the card): title + a top-right meta
// corner (valence sign + strength dots), then body/evidence, then a white «Сохранить»
// tile (Button surface/onSurface=1) pinned bottom-right. Deletion of a saved insight is NOT
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
  /** Confidence → a quiet row of dots ●●○ under the title (weak 1 / moderate 2 /
   *  clear 3). Omitted → nothing (hypotheses pass none). The word lives in aria. */
  strength?: InsightStrength;
  /** Grounding chips (день / еда / событие). Omitted → none (hypotheses). */
  evidence?: InsightEvidence;
  /** Daily analysis hides the always-«сегодня» day-chip; long analysis keeps it. */
  showDays?: boolean;
  action?: ObservationAction;
  /** action='add': raw persistence (saveInsight / saveHypothesis). */
  onAdd?: () => Promise<void>;
  addLabel?: string;
  addedAriaLabel?: string;
  addSuccessToast?: string;
  addErrorToast?: string;
};

// How sure the model is the pattern is real → a quiet row of dots ●●○ right under
// the title (предложка 0b728691: сила связи точками, не словами). Filled = сила;
// the word survives only in title/aria. Rendered for all three strengths (unlike
// the old word-label, dots at «явная» aren't noise — they're a quiet gauge).
const STRENGTH_DOTS: Record<InsightStrength, { filled: number; label: string }> = {
  weak: { filled: 1, label: 'слабая связь' },
  moderate: { filled: 2, label: 'есть связь' },
  clear: { filled: 3, label: 'явная связь' },
};

function StrengthDots({ strength }: { strength: InsightStrength }) {
  const { filled, label } = STRENGTH_DOTS[strength];
  return (
    <span className={styles.strength} title={label} aria-label={label}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={clsx(styles.dot, i < filled && styles.dotOn)} aria-hidden />
      ))}
    </span>
  );
}

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
  addLabel = 'Сохранить',
  addedAriaLabel = 'Сохранено',
  addSuccessToast = 'Сохранено',
  addErrorToast = 'Не удалось сохранить',
}: Props) => {
  const sign = valence ? VALENCE_SIGN[valence] : '';

  // evidence — инлайн-текст «13 июня · курица · тренировка» (предложка 0b728691:
  // без пилюль). Дни (форматированные) + еда + события в одну тихую строку.
  const days = showDays ? (evidence?.days ?? []) : [];
  const foods = evidence?.foods ?? [];
  const events = evidence?.events ?? [];
  const evidenceParts = [...days.map(formatDay), ...foods, ...events];
  const hasEvidence = evidenceParts.length > 0;

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
      className={styles.card}
      data-strength={strength || undefined}
      data-valence={valence || undefined}
    >
      <div className={styles.text}>
        {/* Плитка-подложка (предложка 0b728691 rev2, 2026-07-02): заголовок держит
            левую колонку, а мета-угол (знак valence + точки силы) прижат в правый-
            верхний угол — тихий контур контента. Тело → evidence(инлайн) → кнопка. */}
        <div className={styles.head}>
          <Heading as="h3" role="title" className={styles.cardTitle}>
            {title}
          </Heading>
          {(sign || strength) && (
            <span className={styles.metaCorner}>
              {sign && (
                <span className={styles.valenceSign} aria-hidden>
                  {sign}
                </span>
              )}
              {strength && <StrengthDots strength={strength} />}
            </span>
          )}
        </div>

        {caption && (
          <Text as="span" role="caption" className={styles.hint}>
            {caption}
          </Text>
        )}

        {detail && (
          <Text role="body" className={styles.detail}>
            {detail}
          </Text>
        )}

        {hasEvidence && (
          <Text as="span" role="caption" className={styles.evidence}>
            {evidenceParts.join(' · ')}
          </Text>
        )}

        {action === 'add' && (
          // Белая плитка-кнопка (предложка 0b728691 rev3): карточка = холодный wash
          // предложки, кнопка ЛЕЖИТ на нём → `onSurface={1}` (заливка поднимается до
          // белого surface-2 + hairline-кромка, без тени — всё плоское). Класс .add
          // режет высоту/паддинг с дефолтных 48px до компактной плашки. ✓ сохранено.
          <Button
            variant="surface"
            onSurface={1}
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
