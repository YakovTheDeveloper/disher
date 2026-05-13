import { useMemo } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useModals } from '@/shared/ui/modal-store';
import overlayStyles from '@/shared/ui/Modal/Modal.module.scss';

export const ModalManager = () => {
  const { instances, close, finishClose } = useModals();
  const container = useMemo(
    () => (typeof document !== 'undefined' ? document.getElementById('modal-root') : null),
    [],
  );

  if (instances.length === 0) return null;

  return (
    <>
      {instances.map(({ id, Component, props, phase }) => (
        <Dialog.Root
          key={id}
          open={phase === 'open'}
          onOpenChange={(open) => {
            if (!open) close(id);
          }}
          onOpenChangeComplete={(open) => {
            if (!open) finishClose(id);
          }}
        >
          <Dialog.Portal container={container}>
            <Dialog.Backdrop className={overlayStyles.overlay} />
            <Component {...props} onClose={(result: unknown) => close(id, result)} />
          </Dialog.Portal>
        </Dialog.Root>
      ))}
    </>
  );
};
