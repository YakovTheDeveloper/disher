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
import { useDailyNorms } from '@/entities/daily-norm';
import styles from './OpenDailyNorms.module.scss';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  className?: string;
};

const OpenDailyNorms = ({ className }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedNormId, setSelectedNormId] = React.useState<string | null>(null);
  const { toDailyNorms } = useAppRoutes();
  const { results: normsMap } = useDailyNorms();

  const norms = React.useMemo(() => {
    return normsMap ? Array.from(normsMap.values()) : [];
  }, [normsMap]);

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

  const handleNormClick = (id: string) => {
    setSelectedNormId(id);
    setIsOpen(false);
  };

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
        <span className={styles.label}>текущая</span>
      </div>
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={styles.popover}
            {...interactions.getFloatingProps()}
          >
            <div className={styles.header}>
              <span className={styles.popoverLabel}>Текущая норма:</span>
              <span className={styles.value}>{selectedNorm?.name || 'Не выбрана'}</span>
            </div>

            <div className={styles.list}>
              {norms.map((norm) => (
                <div
                  key={norm.id}
                  className={`${styles.item} ${
                    norm.id === selectedNormId ? styles.selected : ''
                  }`}
                  onClick={() => handleNormClick(norm.id)}
                >
                  {norm.name}
                </div>
              ))}
            </div>

            <button className={styles.link} onClick={toDailyNorms}>
              Перейти к настройке норм
            </button>
          </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default OpenDailyNorms;
