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
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store/store';
import styles from './OpenDailyNorms.module.scss';
import { useAppRoutes } from '@/app/routing/useAppRoutes';

type Props = {
  className?: string;
};

const OpenDailyNorms = observer(({ className }: Props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toDailyNorms } = useAppRoutes();
  const store = useStore();
  const { dailyNormStore } = store;

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

  const norms = React.useMemo(() => {
    return Array.from(dailyNormStore.merged);
  }, [dailyNormStore.merged]);

  const selectedNorm = React.useMemo(() => {
    if (!dailyNormStore.selectedNormId) return null;
    return dailyNormStore.getEntity(dailyNormStore.selectedNormId) || null;
  }, [dailyNormStore.selectedNormId, dailyNormStore.merged]);

  const handleNormClick = (id: string) => {
    dailyNormStore.setSelectedId(id);
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
                    norm.id === dailyNormStore.selectedNormId ? styles.selected : ''
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
});

export default OpenDailyNorms;
