import { observer } from 'mobx-react-lite';
import { motion } from 'framer-motion';
import styles from './ColumnLayoutWithFixedHeader.module.scss';
import { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

type HeaderGradientConfig = {
  initial: string;
  finished: string;
};

type Props = {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  headerClassName?: string;
  contentClassName?: string;
  containerClassName?: string;
  containerStyle?: CSSProperties;
  headerGradient?: HeaderGradientConfig;
};

const DEFAULT_TRANSPARENT_GRADIENT =
  'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0) 100%)';
const DEFAULT_SHADOW_GRADIENT =
  'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.15) 100%)';

const ColumnLayoutWithFixedHeader = ({
  header,
  children,
  footer,
  headerClassName,
  contentClassName,
  containerClassName,
  containerStyle,
  headerGradient,
}: Props) => {
  const transparentGradient = headerGradient?.initial ?? DEFAULT_TRANSPARENT_GRADIENT;
  const shadowGradient = headerGradient?.finished ?? DEFAULT_SHADOW_GRADIENT;

  const headerVariants = {
    initial: { background: transparentGradient },
    animate: { background: shadowGradient },
  };

  return (
    <section className={clsx(styles.container, containerClassName)} style={containerStyle}>
      <motion.header
        className={clsx(styles.header, headerClassName)}
        variants={headerVariants}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className={styles.headerInner}>{header}</div>
      </motion.header>
      <div className={clsx(styles.content, contentClassName)}>{children}</div>
      {footer}
    </section>
  );
};

export default observer(ColumnLayoutWithFixedHeader);
