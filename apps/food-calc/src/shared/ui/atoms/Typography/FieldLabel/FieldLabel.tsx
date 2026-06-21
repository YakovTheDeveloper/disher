import clsx from 'clsx';
import { Text } from '../Text';
import styles from './FieldLabel.module.scss';

type Props = {
  children: React.ReactNode;
  /** Если задан — рендерится семантический `<label htmlFor>` (подпись поля).
   *  Без него — `<span>` (подпись секции, не привязанной к одному инпуту). */
  htmlFor?: string;
  /** Необязательный суффикс тише основного текста («· необязательно»). */
  hint?: React.ReactNode;
  className?: string;
};

/**
 * Канонная подпись поля/секции в overlay'ах. СЕМАНТИКУ несёт сам FieldLabel
 * (`<label htmlFor>` для поля, `<span>` для секции без инпута); ВИД — общий
 * примитив `<Text variant="sectionLabel">`. Один serif-italic голос для меток
 * и заголовков секций, заданный в одном месте (Text.module.scss). `.fieldLabel`
 * несёт только раскладку (display/padding), не типографику.
 */
const FieldLabel = ({ children, htmlFor, hint, className }: Props) => (
  <Text
    as={htmlFor != null ? 'label' : 'span'}
    htmlFor={htmlFor}
    variant="sectionLabel"
    className={clsx(styles.fieldLabel, className)}
  >
    {children}
    {hint != null && <span className={styles.hint}> {hint}</span>}
  </Text>
);

export default FieldLabel;
