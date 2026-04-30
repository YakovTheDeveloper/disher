import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { graphVariants } from './graphVariants';
import styles from './PeriodView.module.scss';

type Props = {
  onOpen: () => void;
};

const PeriodView = ({ onOpen }: Props) => {
  const [active, setActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      <div className={styles.visualizationStack}>
        {graphVariants.map((variant, idx) => (
          <svg
            key={variant.name}
            className={`${styles.visualization} ${styles[`variant${idx + 1}`]}`}
            viewBox="0 0 240 120"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden={idx !== 0 ? 'true' : undefined}
          >
            <g className={styles.lines}>
              {variant.lines.map((line, i) => (
                <line key={i} x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} />
              ))}
            </g>

            <g className={styles.orbs}>
              {variant.nodes.map((node, i) => (
                <circle key={i} className={styles.orb} cx={node[0]} cy={node[1]} r={node[2]} />
              ))}
            </g>
          </svg>
        ))}
      </div>

      <span className={styles.hint}>Нажмите, чтобы установить период жизни</span>
    </div>
  );
};

export default memo(PeriodView);
