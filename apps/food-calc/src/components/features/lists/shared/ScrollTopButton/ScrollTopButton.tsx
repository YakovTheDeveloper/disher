import { observer } from 'mobx-react-lite';
import styles from './ScrollTopButton.module.scss';
import { motion } from 'framer-motion';
import { useScrollToTop } from '@/components/features/lists/shared/hooks/useScrollToTop';

type Props = {
  className?: string;
};

const ScrollTopButton = ({ className }: Props) => {
  const { isVisible: isScrollToTopVisible, scrollToTop } = useScrollToTop();

  return (
    <motion.button
      className={`${styles.container} ${className || ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: isScrollToTopVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      onClick={scrollToTop}
    />
  );
};

export default observer(ScrollTopButton);
