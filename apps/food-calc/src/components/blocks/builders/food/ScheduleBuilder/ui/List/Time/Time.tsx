import { observer } from 'mobx-react-lite';
import { motion } from 'framer-motion';
import styles from './Time.module.scss';
import { useEffect, useState } from 'react';

type Props = {
  children: () => string | null;
  onClick: (id: number | string) => void;
  id: number | string;
};

const Time = ({ children, id, onClick }: Props) => {
  const onClickHandler = () => onClick(id);

  const [animate, setAnimate] = useState(false);
  console.log('LIST_ITEM_TIME');

  useEffect(() => {
    // trigger animation when children change
    setAnimate(true);

    // reset after animation ends (match transition duration)
    const timeout = setTimeout(() => setAnimate(false), 800);
    return () => clearTimeout(timeout);
  }, [children()]);

  return (
    <p onClick={onClickHandler} className={styles.container}>
      <span className={`${styles.text} ${animate ? styles.invert : ''}`}>{children()}</span>
    </p>
  );
};

export default observer(Time);
