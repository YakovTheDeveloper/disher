import clsx from 'clsx';
import styles from './Heading.module.scss';

type Props = {
  children: React.ReactNode;
  /** Type-scale tier. `screen` — page header, `modal` — wizard-flow modal,
   *  `drawer` — drawer header. All share the same italic-serif canon. */
  size: 'screen' | 'modal' | 'drawer';
  /** Heading level for the DOM. Defaults to `h2`. */
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
};

/**
 * Canonical heading — Source Serif 4 italic, matching the HomePage
 * navigation band label. Use for every section/overlay title.
 */
const Heading = ({ children, size, as = 'h2', className }: Props) => {
  const Tag = as;
  return (
    <Tag className={clsx(styles.heading, styles[size], className)}>{children}</Tag>
  );
};

export default Heading;
