import React from 'react';
import styles from './SliderField.module.scss';

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

const SliderField = ({ value, min, max, onChange }: Props) => {
  return (
    <div className={styles.sliderWrapper}>
      <div className={styles.sliderValue}>{value}</div>
      <input
        type="range"
        min={min}
        max={max}
        className={styles.slider}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
};

export default SliderField;
