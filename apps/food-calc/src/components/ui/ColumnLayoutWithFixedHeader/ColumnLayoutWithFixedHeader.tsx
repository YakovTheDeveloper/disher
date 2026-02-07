import { observer } from 'mobx-react-lite';
import { motion } from 'framer-motion';
import styles from './ColumnLayoutWithFixedHeader.module.scss';
import { ReactNode } from 'react';
import clsx from 'clsx';

type Props = {
  /** Content to display in the fixed header */
  header: ReactNode;
  /** Main scrollable content */
  children: ReactNode;
  /** Additional class names for the header */
  headerClassName?: string;
  /** Additional class names for the content container */
  contentClassName?: string;
  /** Enable Framer Motion gradient animation on header */
  animateGradient?: boolean;
  /** Custom transparent gradient (defaults to standard) */
  transparentGradient?: string;
  /** Custom shadow gradient (defaults to standard) */
  shadowGradient?: string;
};

const DEFAULT_TRANSPARENT_GRADIENT =
  'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0) 100%)';
const DEFAULT_SHADOW_GRADIENT =
  'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.15) 100%)';

const ColumnLayoutWithFixedHeader = ({
  header,
  children,
  headerClassName,
  contentClassName,
  animateGradient = true,
  transparentGradient = DEFAULT_TRANSPARENT_GRADIENT,
  shadowGradient = DEFAULT_SHADOW_GRADIENT,
}: Props) => {
  const HeaderWrapper = animateGradient ? motion.header : 'header';

  return (
    <section className={styles.container}>
      {animateGradient ? (
        <motion.header
          className={clsx(styles.header, headerClassName)}
          initial={{ background: transparentGradient }}
          animate={{ background: shadowGradient }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className={styles.headerInner}>{header}</div>
        </motion.header>
      ) : (
        <header className={clsx(styles.header, headerClassName)}>
          <div className={styles.headerInner}>{header}</div>
        </header>
      )}
      <div className={clsx(styles.content, contentClassName)}>{children}</div>
    </section>
  );
};

export default observer(ColumnLayoutWithFixedHeader);
