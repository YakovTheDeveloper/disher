import { UIEvent } from 'react';
import { MotionValue } from 'framer-motion';
import styles from './ScreenScroll.module.scss';
import { observer } from 'mobx-react-lite';

type Props = {
  children: React.ReactNode;
  scrollY: MotionValue<number>;
};

export const ScreenScroll = ({ children, scrollY }: Props) => {
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    scrollY.set(e.currentTarget.scrollTop);
  };

  return (
    <div className={styles.screenScroll} onScroll={handleScroll}>
      {children}
    </div>
  );
};
ScreenScroll.displayName = 'ScreenScroll';

export default observer(ScreenScroll);
