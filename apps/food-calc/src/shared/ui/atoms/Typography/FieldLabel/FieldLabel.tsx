import clsx from 'clsx';
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
 * Канонная подпись поля/секции в overlay'ах — один serif-italic голос.
 * Заменяет ad-hoc `.nativeLabel` / `.hypothesesLabel` / per-drawer `.fieldLabel`.
 */
const FieldLabel = ({ children, htmlFor, hint, className }: Props) => {
  const content = (
    <>
      {children}
      {hint != null && <span className={styles.hint}> {hint}</span>}
    </>
  );

  if (htmlFor != null) {
    return (
      <label className={clsx(styles.fieldLabel, className)} htmlFor={htmlFor}>
        {content}
      </label>
    );
  }

  return <span className={clsx(styles.fieldLabel, className)}>{content}</span>;
};

export default FieldLabel;
