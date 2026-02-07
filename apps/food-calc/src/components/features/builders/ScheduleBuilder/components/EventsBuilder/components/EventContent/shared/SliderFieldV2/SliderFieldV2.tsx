import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './SliderFieldV2.module.scss';

interface SineWaveSliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  width?: number | string;
  height?: number;
  color?: string;
  className?: string;
}

function SliderFieldV2({
  min = 1,
  max = 10,
  step = 1,
  value,
  onChange,
  width = '100%',
  height = 100,
  color = '#9CA3AF',
  className = '',
}: SineWaveSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

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

  const centerY = height / 2;
  const paddingX = 20;
  const effectiveWidth = containerWidth - paddingX * 2;
  const totalCycles = (max - min);
  const maxAmplitude = (height / 2) - 10;
  const minAmplitude = maxAmplitude * 0.1;

  const getPositionForValue = (val: number) => {
    const normalized = (val - min) / (max - min);
    const x = paddingX + normalized * effectiveWidth;
    const currentAmplitude = minAmplitude + normalized * (maxAmplitude - minAmplitude);
    const angle = (Math.PI / 2) + normalized * (totalCycles * 2 * Math.PI);
    const y = centerY - currentAmplitude * Math.sin(angle);
    return { x, y };
  };

  const pathData = useMemo(() => {
    if (effectiveWidth <= 0) return '';

    const points = [];
    const segments = 500;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = paddingX + t * effectiveWidth;
      const currentAmplitude = minAmplitude + t * (maxAmplitude - minAmplitude);
      const angle = (Math.PI / 2) + t * (totalCycles * 2 * Math.PI);
      const y = centerY - currentAmplitude * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    return `M ${points[0]} L ${points.slice(1).join(' ')}`;
  }, [effectiveWidth, centerY, minAmplitude, maxAmplitude, totalCycles]);

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
  }, [min, max, step, effectiveWidth, centerY, minAmplitude, maxAmplitude, totalCycles]);

  const thumbPos = getPositionForValue(value);

  const handlePointerDown = (e: React.PointerEvent) => {
    handlePointerMove(e);
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    if (!containerRef.current) return;

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

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${styles.noSelect} ${styles.touchNone} ${className}`}
      style={{ width, height }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      <svg
        width="100%"
        height="100%"
        className={`${styles.curvedSvg} ${styles.svgOverflowVisible}`}
        style={{ cursor: 'pointer' }}
      >
        <motion.text
          key={value}
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-accent)"
          fontSize="2.5rem"
          fontWeight="bold"
          fontFamily="sans-serif"
          opacity={0.3}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: 0.3 }}
          transition={{
            times: [0, 0.5, 1],
            type: 'keyframes',
            duration: 0.4,
            ease: 'easeInOut',
            opacity: { duration: 0.2 },
          }}
          style={{ pointerEvents: 'none' }}
        >
          {value}
        </motion.text>

        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          className={styles.fiftyOpacity}
        />

        {ticks.map((tick) => (
          <g key={tick.val}>
            <circle cx={tick.x} cy={tick.y} r={3} fill={color} className={styles.eightyOpacity} />
            {(tick.val === min || tick.val === max || tick.val % 5 === 0) && (
              <text
                x={tick.x}
                y={tick.y + 24}
                textAnchor="middle"
                fill={color}
                fontSize="12"
                fontFamily="sans-serif"
                className={styles.noPointerEvents}
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
          fill="var(--color-accent)"
          stroke="white"
          strokeWidth={3}
          initial={false}
          animate={{ cx: thumbPos.x, cy: thumbPos.y }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          style={{
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))',
          }}
        />
      </svg>
    </div>
  );
}

export default SliderFieldV2;
