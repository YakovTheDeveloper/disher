import clsx from 'clsx';
import styles from './Masthead.module.scss';

type Props = {
  children: React.ReactNode;
  /** Heading level for the DOM. Defaults to `h2`. */
  as?: 'h1' | 'h2' | 'h3';
  /** Доп. класс на обёртку `<header>` (page-specific тюнинг). */
  className?: string;
};

/**
 * Apple «Large Title» шапка слайда — крупный жирный sans-заголовок с тающей
 * волосяной бровкой снизу. Канон шапок слайдов HomePage (Анализ / Еда и
 * нутриенты / События дня): один голос на всех трёх. Вынесен из Laboratory
 * `DailyAnalysisSection` — родственник `Heading`, но с собственной бровкой.
 */
const Masthead = ({ children, as = 'h2', className }: Props) => {
  const Tag = as;
  return (
    <header className={clsx(styles.masthead, className)}>
      <Tag className={styles.title}>{children}</Tag>
    </header>
  );
};

export default Masthead;
