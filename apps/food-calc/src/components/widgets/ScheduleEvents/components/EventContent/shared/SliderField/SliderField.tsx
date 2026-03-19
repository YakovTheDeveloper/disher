import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import styles from './SliderField.module.scss';

interface SliderFieldProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showMinMax?: boolean;
  variant?: 'linear' | 'curved';
  color?: string;
  height?: number;
  width?: number | string;
  className?: string;
}

function SliderField({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  step = 1,
  disabled = false,
  showMinMax = true,
  variant = 'curved',
  color = '#9CA3AF',
  height = 100,
  width = '100%',
  className = '',
}: SliderFieldProps) {
  const progress = ((value - min) / (max - min)) * 100;

  if (variant === 'curved') {
    return (
      <div className={`${styles.sliderWrapper} ${disabled ? styles.disabled : ''} ${className}`}>
        {(label || true) && (
          <div className={styles.headerRow}>
            {label && <span className={styles.label}>{label}</span>}
            <div
              className={styles.value}
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
            >
              <span>{value}</span>
            </div>
          </div>
        )}
        <div className={styles.sliderContainer}>
          <CurvedSlider
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            height={height}
            width={width}
            color={color}
            disabled={disabled}
          />
        </div>
        {showMinMax && (
          <div className={styles.minMaxRow}>
            <span>{min}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.sliderWrapper} ${disabled ? styles.disabled : ''} ${className}`}>
      {(label || true) && (
        <div className={styles.headerRow}>
          {label && <span className={styles.label}>{label}</span>}
          <div
            className={styles.value}
            style={{ '--progress': `${progress}%` } as React.CSSProperties}
          >
            <span>{value}</span>
          </div>
        </div>
      )}
      <div className={styles.sliderContainer}>
        <div className={styles.trackBackground}>
          <div className={styles.trackFilled} style={{ width: `${progress}%` }} />
        </div>
        <input
          type="range"
          className={styles.slider}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          aria-label={label}
        />
      </div>
      {showMinMax && (
        <div className={styles.minMaxRow}>
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

interface CurvedSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  height: number;
  width: number | string;
  color: string;
  disabled: boolean;
}

function CurvedSlider({
  value,
  onChange,
  min,
  max,
  step,
  height,
  width,
  color,
  disabled,
}: CurvedSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);

    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, []);

  const amplitude = height * 0.35;
  const frequency = 2;
  const centerY = height / 2;
  const paddingX = 20;
  const effectiveWidth = containerWidth - paddingX * 2;

  const getPositionForValue = (val: number) => {
    const normalized = (val - min) / (max - min);
    const x = paddingX + normalized * effectiveWidth;
    const angle = normalized * (Math.PI * 2 * frequency);
    const y = centerY + amplitude * Math.sin(angle);
    return { x, y };
  };

  const pathData = useMemo(() => {
    if (effectiveWidth <= 0) return '';

    const points = [];
    const segments = 200;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = paddingX + t * effectiveWidth;
      const angle = t * (Math.PI * 2 * frequency);
      const y = centerY + amplitude * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    return `M ${points[0]} L ${points.slice(1).join(' ')}`;
  }, [effectiveWidth, centerY, amplitude, frequency]);

  const ticks = useMemo(() => {
    const tickData = [];
    const count = Math.floor((max - min) / step);

    for (let i = 0; i <= count; i++) {
      const val = min + i * step;
      if (val > max) break;
      const pos = getPositionForValue(val);
      tickData.push({ val, ...pos });
    }
    return tickData;
  }, [min, max, step, effectiveWidth, centerY, amplitude, frequency]);

  const thumbPos = getPositionForValue(value);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    handlePointerMove(e);
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0 && !isDragging) return;
    if (!containerRef.current || disabled) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const clampedX = Math.max(paddingX, Math.min(relativeX, containerWidth - paddingX));
    const normalized = (clampedX - paddingX) / effectiveWidth;
    const rawValue = normalized * (max - min) + min;
    const steppedValue = Math.round(rawValue / step) * step;
    const finalValue = Math.max(min, Math.min(steppedValue, max));

    if (finalValue !== value) {
      onChange(finalValue);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.curvedTrackContainer} ${isDragging ? styles.dragging : ''}`}
      style={{ width, height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg
        width="100%"
        height="100%"
        className={styles.curvedSvg}
        style={{ cursor: disabled ? 'default' : 'pointer' }}
      >
        <defs>
          <linearGradient id="sineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="50%" stopColor="var(--color-purple)" />
            <stop offset="100%" stopColor="var(--accent-secondary)" />
          </linearGradient>
        </defs>

        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          className={styles.sineTrackOpacity}
        />

        {ticks.map((tick) => (
          <g key={tick.val}>
            <circle cx={tick.x} cy={tick.y} r={3} fill={color} className={styles.sineTick} />
            {(tick.val === min || tick.val === max || tick.val % 5 === 0) && (
              <text
                x={tick.x}
                y={tick.y + 24}
                textAnchor="middle"
                fill={color}
                className={styles.sineText}
              >
                {tick.val}
              </text>
            )}
          </g>
        ))}

        <motion.circle
          cx={thumbPos.x}
          cy={thumbPos.y}
          r={10}
          fill="#3B82F6"
          stroke="white"
          strokeWidth={3}
          initial={false}
          animate={{ cx: thumbPos.x, cy: thumbPos.y }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          className={styles.sineThumb}
          style={{
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
          }}
        />
      </svg>
    </div>
  );
}

export default SliderField;
