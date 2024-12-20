import React, { useRef, useState } from "react";
import styles from "./Slider.module.css";
import clsx from "clsx";
import HoverTrack from "@/components/ui/Slider/HoverTrack";
import { observer } from "mobx-react-lite";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number; // Controlled value
  onChange: (value: number) => void; // Callback to propagate changes
  label?: React.ReactNode;

  marks?: number[]
  className?: string;
}



const Slider: React.FC<SliderProps> = ({
  min = 0.1,
  max = 3.0,
  step = 0.1,
  value,
  onChange,
  label,
  marks = [0, 100, 200, 300, 400, 500],
  className
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  // const [previewValue, setPreviewValue] = useState<number | null>(null);

  const calculateValue = (percentage: number) => {
    const newValue = min + (percentage / 100) * (max - min);
    return Math.round(newValue / step) * step;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    const { left, width } = sliderRef.current.getBoundingClientRect();
    const percentage = Math.min(Math.max((e.clientX - left) / width, 0), 1) * 100;
    const newValue = calculateValue(percentage);
    onChange(newValue);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const percentage = Math.min(
        Math.max((moveEvent.clientX - left) / width, 0),
        1
      ) * 100;
      const newValue = calculateValue(percentage);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const percentage = Math.min(((value - min) / (max - min)) * 100, 100);

  return (
    <div className={clsx([styles.container, className])}>
      {label && <div className={styles.label}>{label}</div>}
      <div className={styles.helperValues}>
        {marks.map(mark => (
          <span
            className={styles.helperValue}
            onClick={() => onChange(mark)}
          >
            {mark}
          </span>
        ))}
      </div>
      <div
        ref={sliderRef}
        className={styles.slider}
        onMouseDown={handleMouseDown}
      >
        <HoverTrack
          min={min}
          max={max}
          step={step}
        />
        <div
          className={styles.track}
          style={{ width: `${percentage}%` }}
        />
        <div
          className={styles.thumb}
          style={{
            left: `calc(${percentage}% - 8px)`,
          }}
        />
      </div>
    </div>
  );
};

export default observer(Slider);
