import { useState, useEffect, useRef, useCallback } from 'react';
import { graphVariants } from './graphVariants';
import styles from './PeriodView.module.scss';

type Props = {
  onOpen: () => void;
};

const PeriodView = ({ onOpen }: Props) => {
  const [variantIndex, setVariantIndex] = useState(0);
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setVariantIndex((prev) => (prev + 1) % graphVariants.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Click outside to deactivate
  useEffect(() => {
    if (!active) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside as EventListener);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [active]);

  const handleClick = useCallback(() => {
    if (!active) {
      setActive(true);
    } else {
      setActive(false);
      onOpen();
    }
  }, [active, onOpen]);

  return (
    <div ref={containerRef} className={`${styles.container} ${active ? styles.active : ''}`} onClick={handleClick}>
        <svg
            className={styles.visualization}
            viewBox="0 0 240 120"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="brightGlow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <g className={styles.lines}>
              {graphVariants[variantIndex].lines.map((line, i) => (
                <line key={i} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} />
              ))}
            </g>

            <g className={styles.orbs}>
              {graphVariants[variantIndex].nodes.map((node, i) => (
                <circle key={i} className={styles.orb} cx={node[0]} cy={node[1]} r={node[2]} />
              ))}
            </g>
          </svg>

        <span className={styles.hint}>Нажмите, чтобы установить период жизни</span>
      </div>
  );
};

export default PeriodView;
