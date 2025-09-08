import React, { useEffect, useState } from "react";
import styles from "./Spinner.module.css";

interface SpinnerProps {
  size?: number; // Size of the spinner in pixels
  color?: string; // Spinner color
  ariaLabel?: string; // Accessible label for the spinner
  initialWidth?: number; // Initial width of the container
  finalWidth?: number; // Final width of the container
  animationDuration?: number; // Duration of the width transition in milliseconds
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 18,
  color = "rgb(76, 175, 80)",
  ariaLabel = "Loading...",
  initialWidth = 0,
  finalWidth = 50,
  animationDuration = 300,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsExpanded(true), 10); // Small delay to trigger animation
    return () => clearTimeout(timer);
  }, []);

  const containerStyle = {
    width: isExpanded ? `${finalWidth}px` : `${initialWidth}px`,
    transition: `width ${animationDuration}ms ease-in-out`,
  };

  const spinnerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderColor: `${color} transparent transparent transparent`,
  };

  return (
    <div className={styles.container} style={containerStyle}>
      <div className={styles.spinner} role="status" aria-label={ariaLabel}>
        <div className={styles.circle} style={spinnerStyle}></div>
        <div className={styles.circle} style={spinnerStyle}></div>
        <div className={styles.circle} style={spinnerStyle}></div>
        <div className={styles.circle} style={spinnerStyle}></div>
      </div>
    </div>
  );
};

export default Spinner;
