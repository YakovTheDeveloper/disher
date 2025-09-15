import { observer } from 'mobx-react-lite';
import { motion } from 'framer-motion';
import styles from './Time.module.scss';
import { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
  onClick: (id: number | string) => void;
  id: number | string;
};

const Time = ({ children, id, onClick }: Props) => {
  const onClickHandler = () => onClick(id);

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // trigger animation when children change
    setAnimate(true);

    // reset after animation ends (match transition duration)
    const timeout = setTimeout(() => setAnimate(false), 800);
    return () => clearTimeout(timeout);
  }, [children]);

  return (
    <p onClick={onClickHandler} className={styles.container}>
      <span>{children}</span>

      {animate && (
        <motion.span
          initial={{ x: 0, opacity: 0 }}
          animate={{ x: 50, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className={styles.circle}
        />
      )}
    </p>
  );
};

export default observer(Time);
