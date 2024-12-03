import React, { useRef } from "react";

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number; // Controlled value
  onChange: (value: number) => void; // Callback to propagate changes
  label: React.ReactNode // Callback to propagate changes
}

const Slider: React.FC<SliderProps> = ({
  min = 0.1,
  max = 3.0,
  step = 0.1,
  value,
  onChange,
  label
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
    console.log('fuck')
    onChange(newValue);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newValue = calculateValue(moveEvent.clientX);
      console.log('fuck', onChange)

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
    <div style={styles.container}>
      <div style={styles.label}>
        {label}
        {/* Value: {value.toFixed(1)} */}
      </div>
      <div
        ref={sliderRef}
        style={styles.slider}
        onMouseDown={handleMouseDown}
      >
        <div style={{ ...styles.track, width: `${percentage}%` }} />
        <div
          style={{
            ...styles.thumb,
            left: `calc(${percentage}% - 10px)`,
          }}
        />
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: "300px",
    padding: "20px",
  },
  label: {
    marginBottom: "10px",
    fontSize: "14px",
  },
  slider: {
    position: "relative" as "relative",
    height: "6px",
    background: "#ccc",
    borderRadius: "3px",
    cursor: "pointer",
  },
  track: {
    position: "absolute" as "absolute",
    height: "100%",
    background: "#007bff",
    borderRadius: "3px",
  },
  thumb: {
    position: "absolute" as "absolute",
    top: "-7px",
    width: "20px",
    height: "20px",
    background: "#007bff",
    borderRadius: "50%",
    cursor: "grab",
    transform: "translateX(-50%)",
  },
};

export default Slider;
