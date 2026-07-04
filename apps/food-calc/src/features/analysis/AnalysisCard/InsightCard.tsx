import { memo } from 'react';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import clsx from 'clsx';
import type { InsightValence, InsightStrength, InsightEvidence } from '@/entities/insight';
import AnalysisCard from './AnalysisCard';
import CardSaveButton from './CardSaveButton';
import CardEditChevron from './CardEditChevron';
import styles from './AnalysisCard.module.scss';

// InsightCard — ветка AnalysisCard для инсайта И наблюдения (наблюдение =
// «инсайт минус valence», read-only). Слоты: title + мета-угол (знак valence +
// значок силы) + detail + нижний ряд (evidence слева, действие справа).
//   • variant='not-added' — карточка в результате разбора: кнопка «Сохранить»
//     (если передан onAdd; наблюдение onAdd не передаёт → read-only, без кнопки).
//   • variant='added'     — сохранённый инсайт: шеврон-правка снизу-справа.
export const EDIT_INSIGHT_ARIA = 'Редактировать инсайт';

type Props = {
  title: string;
  detail?: string;
  /** Инсайт → монохромный знак ＋/− перед заголовком. Наблюдение omit/'neutral'. */
  valence?: InsightValence;
  /** Сила связи → восходящие столбики (1/2/3). Omit → ничего. */
  strength?: InsightStrength;
  evidence?: InsightEvidence;
  /** Дневной разбор прячет всегда-«сегодня» день-чип; длинный — оставляет. */
  showDays?: boolean;
  variant: 'added' | 'not-added';
  /** variant='not-added': сырое сохранение (saveInsight). */
  onAdd?: () => Promise<void>;
  /** variant='added': открыть правку (пишет editingId в parent). */
  onEdit?: () => void;
  editInputHtmlFor?: string;
};

// Сила связи ●●○ → восходящие столбики (силуэт chart-bars пикера нутриентов):
// заполнено = уровень. Слово живёт в title/aria; холодный серый несёт scss.
const STRENGTH: Record<InsightStrength, { filled: number; label: string }> = {
  weak: { filled: 1, label: 'слабая связь' },
  moderate: { filled: 2, label: 'есть связь' },
  clear: { filled: 3, label: 'явная связь' },
};

function StrengthBars({ strength }: { strength: InsightStrength }) {
  const { filled, label } = STRENGTH[strength];
  return (
    <span className={styles.strength} title={label} aria-label={label}>
      <svg className={styles.strengthIcon} viewBox="0 0 24 24" fill="none" aria-hidden>
        {/* три восходящих столбика (короткий → выше → самый высокий) */}
        <rect
          x="3"
          y="14"
          width="4.4"
          height="7"
          rx="1.6"
          className={clsx(styles.bar, filled < 1 && styles.barOff)}
        />
        <rect
          x="9.8"
          y="9"
          width="4.4"
          height="12"
          rx="1.6"
          className={clsx(styles.bar, filled < 2 && styles.barOff)}
        />
        <rect
          x="16.6"
          y="4"
          width="4.4"
          height="17"
          rx="1.6"
          className={clsx(styles.bar, filled < 3 && styles.barOff)}
        />
      </svg>
    </span>
  );
}

// Знак valence БЕЗ цвета (F3): тихий монохромный ＋/− в мета-углу. Neutral — пусто.
const VALENCE_SIGN: Record<InsightValence, string> = {
  positive: '+',
  negative: '−',
  neutral: '',
};

// Дни бэка — `dd-MM-yyyy`. Гуманизируем в «13 июня» (ru); фолбэк — сырая строка.
function formatDay(day: string): string {
  const parsed = parse(day, 'dd-MM-yyyy', new Date());
  return isValid(parsed) ? format(parsed, 'd MMMM', { locale: ru }) : day;
}

const InsightCard = ({
  title,
  detail,
  valence,
  strength,
  evidence,
  showDays = true,
  variant,
  onAdd,
  onEdit,
  editInputHtmlFor,
}: Props) => {
  const sign = valence ? VALENCE_SIGN[valence] : '';

  // evidence — инлайн-текст «13 июня · курица · тренировка» одной тихой строкой.
  const days = showDays ? (evidence?.days ?? []) : [];
  const foods = evidence?.foods ?? [];
  const events = evidence?.events ?? [];
  const evidenceParts = [...days.map(formatDay), ...foods, ...events];
  const hasEvidence = evidenceParts.length > 0;

  const metaCorner =
    sign || strength ? (
      <>
        {sign && (
          <span className={styles.valenceSign} aria-hidden>
            {sign}
          </span>
        )}
        {strength && <StrengthBars strength={strength} />}
      </>
    ) : undefined;

  const footerRight =
    variant === 'added'
      ? onEdit && editInputHtmlFor && (
          <CardEditChevron
            onEdit={onEdit}
            editInputHtmlFor={editInputHtmlFor}
            ariaLabel={EDIT_INSIGHT_ARIA}
          />
        )
      : onAdd && (
          <CardSaveButton
            onAdd={onAdd}
            addedAriaLabel="Инсайт сохранён"
            successToast="Инсайт сохранён"
            errorToast="Не удалось добавить инсайт"
          />
        );

  return (
    <AnalysisCard
      title={title}
      detail={detail}
      metaCorner={metaCorner}
      footerLeft={hasEvidence ? evidenceParts.join(' · ') : undefined}
      footerRight={footerRight || undefined}
    />
  );
};

export default memo(InsightCard);
