import * as Dialog from '@radix-ui/react-dialog';
import styles from './Modal.module.scss';
import { useModals } from '@/shared/ui/modal-store';

interface ModalProps {
  children: React.ReactNode;
}

const ModalComponent = ({ children }: ModalProps) => {
  const { isOpen, closeLast } = useModals();

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && isOpen) {
          closeLast();
        }
      }}
    >
      <Dialog.Portal container={document.getElementById('modal-root')}>
        <Dialog.Overlay className={styles.overlay} />
        {children}
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ModalComponent;
