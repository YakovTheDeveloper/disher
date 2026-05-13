import { FC, ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { useUserNormItems, DEFAULT_NORM_ITEMS } from '@/entities/daily-norm';
import styles from './FilterNutrients.module.scss';

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

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

const EyeIcon: FC<{ open: boolean }> = ({ open }) => (
  <span style={{ display: 'flex', alignItems: 'center' }}>
    {open ? <EyeOpenIcon /> : <EyeClosedIcon />}
  </span>
);

interface CardOverrideProps {
  dimmed?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}

interface Props {
  isHidden: boolean;
  filterMode: boolean;
  onToggle: () => void;
  renderCard: (overrides: CardOverrideProps) => ReactNode;
  nutrientId?: string;
  nutrientName?: string;
  nutrientKey?: string;
  actionSlot?: ReactNode;
}

const FilterNutrientCardWrapper: FC<Props> = ({
  isHidden,
  filterMode,
  onToggle,
  renderCard,
  actionSlot,
  nutrientId,
  nutrientKey,
}) => {
  const { toNutrientArticle } = useAppRoutes();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const userItems = useUserNormItems();

  const getCurrentNormValue = useCallback(() => {
    if (!nutrientId) return 0;
    const items = userItems ?? DEFAULT_NORM_ITEMS;
    return items[nutrientId] ?? 0;
  }, [nutrientId, userItems]);

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

  if (filterMode) {
    return (
      <div ref={wrapperRef} className={styles.cardWrapper}>
        {renderCard({
          dimmed: isHidden,
          onClick: onToggle,
          children: <EyeIcon open={!isHidden} />,
        })}
      </div>
    );
  }

  const handleCardClick = () => {
    setOverlayOpen((prev) => !prev);
  };

  return (
    <div
      ref={wrapperRef}
      className={styles.cardWrapper}
      onClick={handleCardClick}
    >
      {renderCard({})}

      <AnimatePresence>
        {overlayOpen && (
          <motion.div
            className={styles.cardOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className={styles.cardOverlayTop}>
              <motion.div
                className={styles.cardOverlayLeft}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.12, delay: 0.03 }}
              >
                {actionSlot}
              </motion.div>
              <motion.div
                className={styles.cardOverlayRight}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.12, delay: 0.03 }}
              >
                {nutrientId && nutrientKey && (
                  <button
                    className={styles.overlayEyeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      toNutrientArticle(`${nutrientId}_${nutrientKey}`);
                    }}
                    aria-label="Статья о нутриенте"
                  >
                    <InfoIcon />
                  </button>
                )}
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
              </motion.div>
            </div>

            {nutrientId && (
              <motion.div
                className={styles.cardOverlayBottom}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12, delay: 0.05 }}
              >
                <span className={styles.normEditLabel}>
                  Норма: {getCurrentNormValue() || '—'}
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterNutrientCardWrapper;
