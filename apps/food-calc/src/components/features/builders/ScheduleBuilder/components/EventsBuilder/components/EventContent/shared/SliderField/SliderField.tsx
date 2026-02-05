import React from 'react';
import styles from './SliderField.module.scss';

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  children: React.ReactNode;
  disabled?: boolean;
};

const SliderField = ({ value, min, max, onChange, children, disabled = false }: Props) => {
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className={`${styles.sliderWrapper} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.headerRow}>
        <div className={styles.label}>{children}</div>
        <div className={styles.value} style={{ ['--progress' as string]: `${progress}%` }}>
          {value}
        </div>
      </div>

      <div className={styles.sliderContainer}>
        <div
          className={styles.trackBackground}
          style={{ ['--progress' as string]: `${progress}%` }}
        >
          <div className={styles.trackFilled} />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          className={styles.slider}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
        />
      </div>

      <div className={styles.minMaxRow}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default SliderField;
