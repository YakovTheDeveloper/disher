import * as React from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
} from '@floating-ui/react';
import { AnimatePresence, motion } from 'motion/react';
import {
  useDailyNorms,
  DEFAULT_NORM_ID,
  DEFAULT_NORM,
  SPORTS_NORM_ID,
  SPORTS_NORM,
} from '@/entities/daily-norm';
import styles from './OpenDailyNorms.module.scss';
import CreateDailyNormModal, { CREATE_NORM_INPUT_ID } from './CreateDailyNormModal';
import { modalStore } from '@/shared/ui';
import EditDailyNormModal from './EditDailyNormModal';

type Props = {
  className?: string;
};

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

const TickIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const OpenDailyNorms = ({ className }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedNormId, setSelectedNormId] = React.useState<string | null>(DEFAULT_NORM_ID);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const normsList = useDailyNorms();

  const norms = React.useMemo(() => {
    const result = [...normsList];
    if (!result.some((n) => n.id === DEFAULT_NORM_ID)) result.unshift(DEFAULT_NORM as any);
    if (!result.some((n) => n.id === SPORTS_NORM_ID)) result.splice(1, 0, SPORTS_NORM as any);
    return result;
  }, [normsList]);

  const selectedNorm = React.useMemo(() => {
    if (!selectedNormId) return null;
    return norms.find((n) => n.id === selectedNormId) || null;
  }, [selectedNormId, norms]);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        crossAxis: true,
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    enabled: true,
  });

  const interactions = useInteractions([click, dismiss]);

  const handleNormSelect = (id: string) => {
    setSelectedNormId(id);
  };

  const handleInfoClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIsOpen(false);
    modalStore.show(EditDailyNormModal, { normId: id });
  };

  const handleFocusCapture = React.useCallback((e: React.FocusEvent) => {
    const id = (e.target as HTMLElement).id;
    if (id === CREATE_NORM_INPUT_ID) {
      setCreateModalOpen(true);
      setIsOpen(false);
    }
  }, []);

  return (
    <>
      <div
        ref={refs.setReference}
        className={`${styles.container} ${className || ''}`}
        {...interactions.getReferenceProps()}
      >
        <button className={styles.button} type="button">
          {selectedNorm?.name || 'Выбрать норму'}
        </button>
        <span className={styles.descriptionLabel}>дневная норма</span>
        <span className={styles.decorative}>%</span>
      </div>
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={styles.popover}
            {...interactions.getFloatingProps()}
          >
            <div className={styles.list}>
              <AnimatePresence initial={false}>
                {norms.map((norm, i) => {
                  const isSelected = norm.id === selectedNormId;
                  return (
                    <motion.div
                      key={norm.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.02 }}
                      className={`${styles.item} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleNormSelect(norm.id)}
                    >
                      <span className={styles.itemName}>{norm.name}</span>
                      <div className={styles.itemActions}>
                        {isSelected && (
                          <motion.span
                            className={styles.tickWrap}
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                          >
                            <TickIcon />
                          </motion.span>
                        )}
                        <button
                          className={styles.infoBtn}
                          onClick={(e) => handleInfoClick(e, norm.id)}
                          type="button"
                        >
                          <InfoIcon />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <label htmlFor={CREATE_NORM_INPUT_ID} className={styles.link}>
              Создать новую норму
            </label>
          </div>
        )}
      </FloatingPortal>
      <div onFocusCapture={handleFocusCapture}>
        <CreateDailyNormModal
          isExpanded={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
        />
      </div>
    </>
  );
};

export default OpenDailyNorms;
