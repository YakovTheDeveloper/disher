import { FC, ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import styles from './FilterNutrients.module.scss';

const EyeOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

interface Props {
  isHidden: boolean;
  filterMode: boolean;
  onToggle: () => void;
  children: ReactNode;
  nutrientId?: string;
  nutrientName?: string;
  actionSlot?: ReactNode;
}

const FilterNutrientCardWrapper: FC<Props> = ({
  isHidden,
  filterMode,
  onToggle,
  children,
  actionSlot,
}) => {
  const [overlayOpen, setOverlayOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOverlayOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (overlayOpen) {
      document.addEventListener('pointerdown', handleOutsideClick);
      return () => document.removeEventListener('pointerdown', handleOutsideClick);
    }
  }, [overlayOpen, handleOutsideClick]);

  if (isHidden && !filterMode) return null;

  const handleCardClick = () => {
    if (filterMode) {
      onToggle();
    } else {
      setOverlayOpen((prev) => !prev);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={clsx(styles.cardWrapper, isHidden && styles.hiddenCard)}
      onClick={handleCardClick}
    >
      {children}

      {filterMode && (
        <div className={styles.eyeOverlay}>
          {isHidden ? <EyeClosedIcon /> : <EyeOpenIcon />}
        </div>
      )}

      {overlayOpen && !filterMode && (
        <div className={styles.cardOverlay}>
          <div className={styles.cardOverlayLeft}>
            {actionSlot}
          </div>
          <div className={styles.cardOverlayRight}>
            <button
              className={styles.overlayEyeBtn}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
                setOverlayOpen(false);
              }}
            >
              {isHidden ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterNutrientCardWrapper;
