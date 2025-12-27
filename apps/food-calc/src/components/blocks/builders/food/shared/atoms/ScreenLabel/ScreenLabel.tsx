import { observer } from 'mobx-react-lite';
import styles from './ScreenLabel.module.scss';

type Props = {
  children: React.ReactNode;
  opacity?: number;
  fontSize?: string | number;
  letterSpacing?: string | number;
};

const ScreenLabel = ({ children, opacity, fontSize, letterSpacing }: Props) => {
  return (
    <div
      className={styles.ScreenLabel}
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
