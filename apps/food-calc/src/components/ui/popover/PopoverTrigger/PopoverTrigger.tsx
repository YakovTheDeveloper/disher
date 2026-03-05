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
import styles from './PopoverTrigger.module.scss';
import clsx from 'clsx';

interface PopoverTriggerProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  placement?: Placement;
}

const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  trigger,
  content,
  placement = 'bottom-end',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const { refs, floatingStyles, context } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
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
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={styles.content}
          >
            {content}
          </div>
        )}
      </FloatingPortal>
    </>
  );
};

export default PopoverTrigger;
