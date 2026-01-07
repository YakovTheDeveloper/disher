import { observer } from 'mobx-react-lite';
import styles from './ScreenLabel.module.scss';
import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  opacity?: number;
  fontSize?: string | number;
  letterSpacing?: string | number;
  className?: string;
  variant: keyof typeof fontStyle;
};

const ScreenLabel = ({ children, opacity, className, variant }: Props) => {
  return (
    <p
      className={clsx([className, styles.ScreenLabel])}
      style={{
        opacity,
        ...fontStyle[variant],
      }}
    >
      {children}
    </p>
  );
};

const fontStyle = {
  screenHeader: {
    fontSize: '50px',
    letterSpacing: '-3px',
  },
  drawer: {
    fontSize: '50px',
    letterSpacing: '-3px',
    paddingLeft: '10px',
  },
  formValueLabel: {
    fontSize: '100px',
  },
};

export default observer(ScreenLabel);
