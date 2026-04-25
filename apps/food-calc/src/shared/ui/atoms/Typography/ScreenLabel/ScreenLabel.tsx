import styles from './ScreenLabel.module.scss';
import clsx from 'clsx';

type Props = {
  children: React.ReactNode;
  opacity?: number;
  className?: string;
  variant: 'screenHeader' | 'drawer' | 'formValueLabel' | 'nutrients';
  onClick?: () => void;
};

const ScreenLabel = ({ children, opacity, className, variant, onClick }: Props) => {
  return (
    <p
      className={clsx(className, styles.ScreenLabel, styles[`ScreenLabel--${variant}`])}
      style={{ opacity }}
    >
      <div onClick={onClick}>{children}</div>
      {/* <span className={clsx(styles.decorative)}>
        <svg width="200" height="100" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,50 Q30,20 50,50 Q70,80 90,50" stroke="black" strokeWidth="2" fill="none" />
          <path d="M55,50 Q75,20 95,50 Q115,80 135,50" stroke="black" strokeWidth="2" fill="none" />
          <path
            d="M100,50 Q120,20 140,50 Q160,80 180,50"
            stroke="black"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </span> */}
    </p>
  );
};

export default ScreenLabel;
