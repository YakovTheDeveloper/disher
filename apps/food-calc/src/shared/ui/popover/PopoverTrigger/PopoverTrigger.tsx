import * as React from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  FloatingArrow,
} from '@floating-ui/react';
import type { Placement } from '@floating-ui/react';
import clsx from 'clsx';
import styles from './PopoverTrigger.module.scss';

interface PopoverTriggerProps {
  trigger: React.ReactNode;
  /** Node, or a render-prop that receives `close` so the panel can carry its own dismiss control. */
  content: React.ReactNode | ((close: () => void) => React.ReactNode);
  placement?: Placement;
  /**
   * Sit the panel ON TOP of the trigger (top edges aligned) instead of floating below it, so a
   * control in the panel's corner visually replaces the trigger. Disables flip (no jump-away).
   */
  overlapTrigger?: boolean;
  /**
   * Surface-тир фона панели (= `--sys-color-surface-N`). Дефолт `2` (самый верхний
   * — плавающий оверлей). Задаётся консумером: маленький попап на модалке может
   * лечь на `1`, чтобы чипы/контролы surface-2 читались подъёмом над панелью.
   */
  surface?: 0 | 1 | 2;
  /**
   * Облик панели. `panel` (дефолт) — плавающая панель с КОНТРОЛАМИ внутри (фильтры):
   * радиус контейнера, тень оверлея. `hint` — бумажка-подсказка с прозой: минимальные
   * скругления, свой воздух, покойная тень, мера строки по кеглю. Разделены потому,
   * что это два разных класса объектов, а не два вкуса одного: у подсказки нет
   * интерактива, и тень/радиус панели делали из неё маленькую копию модалки.
   */
  variant?: 'panel' | 'hint';
}

const SURFACE_CLASS = { 0: styles.surface0, 1: styles.surface1, 2: undefined } as const;

const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  trigger,
  content,
  placement = 'bottom-end',
  overlapTrigger = false,
  surface = 2,
  variant = 'panel',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const close = React.useCallback(() => setIsOpen(false), []);
  const arrowRef = React.useRef<SVGSVGElement>(null);
  const isHint = variant === 'hint';

  const { refs, floatingStyles, context } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      // overlap: pull the panel up by the trigger's own height so its top aligns with the
      // trigger top → the panel's corner control lands exactly over the trigger glyph.
      // hint: чуть больший зазор — в нём сидит уголок, указывающий на ⓘ.
      overlapTrigger ? offset(({ rects }) => -rects.reference.height) : offset(isHint ? 8 : 4),
      ...(overlapTrigger
        ? []
        : [
            flip({
              crossAxis: placement.includes('-'),
              fallbackAxisSideDirection: 'start' as const,
              padding: 5,
            }),
          ]),
      shift({ padding: 5 }),
      // Уголок-указатель на триггер — только у бумажки-подсказки (panel-вариант с
      // контролами в нём не нуждается). padding держит уголок от скруглённых углов.
      isHint && arrow({ element: arrowRef, padding: 8 }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, { enabled: true });
  const role = useRole(context, { role: 'dialog' });

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} className={styles.trigger}>
        {trigger}
      </div>
      <FloatingPortal>
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
          className={clsx(
            styles.content,
            SURFACE_CLASS[surface],
            variant === 'hint' && styles.hint,
            overlapTrigger && styles.overlap,
            !isOpen && styles.closed,
          )}
          aria-hidden={!isOpen}
        >
          {typeof content === 'function' ? content(close) : content}
          {isHint && (
            // fill = фон бумажки (hint всегда на surface-2). tipRadius смягчает
            // остриё под бумажную метафору. Тень панели уголок не несёт — на этом
            // размере это незаметно и является обычной практикой для tooltip-стрелки.
            <FloatingArrow
              ref={arrowRef}
              context={context}
              tipRadius={1}
              fill="var(--sys-color-surface-2)"
            />
          )}
        </div>
      </FloatingPortal>
    </>
  );
};

export default PopoverTrigger;
