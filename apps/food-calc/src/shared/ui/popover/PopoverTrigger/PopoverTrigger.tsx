import * as React from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
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
}

const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  trigger,
  content,
  placement = 'bottom-end',
  overlapTrigger = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const close = React.useCallback(() => setIsOpen(false), []);

  const { refs, floatingStyles, context } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      // overlap: pull the panel up by the trigger's own height so its top aligns with the
      // trigger top → the panel's corner control lands exactly over the trigger glyph.
      overlapTrigger ? offset(({ rects }) => -rects.reference.height) : offset(4),
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
          className={clsx(styles.content, overlapTrigger && styles.overlap, !isOpen && styles.closed)}
          aria-hidden={!isOpen}
        >
          {typeof content === 'function' ? content(close) : content}
        </div>
      </FloatingPortal>
    </>
  );
};

export default PopoverTrigger;
