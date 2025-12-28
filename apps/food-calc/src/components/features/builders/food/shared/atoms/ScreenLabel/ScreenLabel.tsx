import { observer } from 'mobx-react-lite';
import styles from './ScreenLabel.module.scss';
import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  opacity?: number;
  fontSize?: string | number;
  letterSpacing?: string | number;
  className?: string;
};

const ScreenLabel = ({ children, opacity, fontSize, letterSpacing, className }: Props) => {
  return (
    <div
      className={clsx([className, styles.ScreenLabel])}
      style={{
        opacity,
        fontSize,
        letterSpacing,
      }}
    >
      {children}
    </div>
  );
};

export default observer(ScreenLabel);
