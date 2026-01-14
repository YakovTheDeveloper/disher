import * as Dialog from '@radix-ui/react-dialog';
import { observer } from 'mobx-react-lite';
import styles from './Modal.module.scss';
import { ModalStoreInstance } from '../../../store/GlobalUiStore/ModalStore/ModalStore';
import { domainStore } from '@/store/store';

interface ModalProps {
  modalStore?: ModalStoreInstance;
  children: React.ReactNode;
}

const ModalComponent = ({
  modalStore = domainStore.globalUiStore.modalStore,
  children,
}: ModalProps) => {
  const currentModal = modalStore.currentModal;

  return (
    <Dialog.Root
      open={!!currentModal}
      onOpenChange={(open) => {
        if (!open) {
          modalStore.closeModal();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />

        <Dialog.Content className={styles.modal}>
          <button
            className={styles.closeButton}
            // aria-label="Close"
            onClick={(e) => {
              e.stopPropagation();
              modalStore.closeModal();
            }}
          >
            ×
          </button>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default observer(ModalComponent);
