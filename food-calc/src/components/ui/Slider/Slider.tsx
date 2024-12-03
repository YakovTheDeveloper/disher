import React, { useRef } from "react";
import styles from "./Slider.module.css";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number; // Controlled value
  onChange: (value: number) => void; // Callback to propagate changes
  label: React.ReactNode;
}

const Slider: React.FC<SliderProps> = ({
  min = 0.1,
  max = 3.0,
  step = 0.1,
  value,
  onChange,
  label,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const calculateValue = (clientX: number) => {
    if (!sliderRef.current) return value;
    const { left, width } = sliderRef.current.getBoundingClientRect();
    const percentage = Math.min(Math.max((clientX - left) / width, 0), 1);
    const newValue = min + percentage * (max - min);
    return Math.round(newValue / step) * step;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const newValue = calculateValue(e.clientX);
    onChange(newValue);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newValue = calculateValue(moveEvent.clientX);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div
      className={styles.container}
    >
      <div className={styles.label}>{label}</div>
      <div
        ref={sliderRef}
        className={styles.slider}
        onMouseDown={handleMouseDown}
      >
        <div
          className={styles.track}
          style={{ width: `${percentage}%` }}
        />
        <div
          className={styles.thumb}
          style={{
            left: `calc(${percentage}% - 10px)`,
          }}
        />
      </div>
    </div >
  );
};

export default Slider;
