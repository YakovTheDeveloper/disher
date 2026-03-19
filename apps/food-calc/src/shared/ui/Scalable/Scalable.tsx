import { observer } from 'mobx-react-lite';
import styles from './Scalable.module.scss';
import { motion, useTransform, MotionValue } from 'framer-motion';

type Props = {
  scrollYProgress: MotionValue<number>;
  children: React.ReactNode;
  className?: string;
};

const Scalable = ({ scrollYProgress, children, className }: Props) => {
  const numbersScale = useTransform(scrollYProgress, [0.5, 1], [2, 1]);

  const backgroundColor = useTransform(scrollYProgress, (v) =>
    v >= 0.999 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0)'
  );

  const backdropFilter = useTransform(scrollYProgress, (v) => (v >= 0.999 ? 'blur(30px)' : 'none'));

  return (
    <motion.div
      className={`${styles.Scalable} ${className || ''}`}
      style={{
        scale: numbersScale,
        backgroundColor,
        backdropFilter,
      }}
    >
      {children}
    </motion.div>
  );
};

export default observer(Scalable);
