import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import styles from './AnalysisCard.module.scss';

// Тихий шеврон-правка карточки разбора (variant='added'), снизу-справа в нижнем
// мета-ряду (не отдельная колонка, запрос юзера 2026-07-04). label htmlFor →
// фокусит общий edit-input Edit*Modal (делегирование фокуса), onClick пишет
// editingId в parent; step перевернёт onFocusCapture после доставки фокуса.
type Props = {
  onEdit: () => void;
  editInputHtmlFor: string;
  ariaLabel: string;
};

const CardEditChevron = ({ onEdit, editInputHtmlFor, ariaLabel }: Props) => (
  <label
    htmlFor={editInputHtmlFor}
    className={styles.editChevron}
    onClick={onEdit}
    aria-label={ariaLabel}
  >
    <ChevronGlyph />
  </label>
);

export default CardEditChevron;
