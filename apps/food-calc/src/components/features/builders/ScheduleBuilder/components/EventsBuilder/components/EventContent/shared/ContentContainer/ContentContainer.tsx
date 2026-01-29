import { observer } from 'mobx-react-lite';
import styles from './ContentContainer.module.scss';
import clsx from 'clsx';
import { motion } from 'framer-motion';

type Props = {
  children: React.ReactNode;
  className?: string;
};

const ContentContainer = ({ children, className }: Props) => {
  return (
    <motion.div
      className={clsx([styles.container, className])}
      initial={{ opacity: 0.3, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

export default observer(ContentContainer);
