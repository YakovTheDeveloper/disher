import Modal from 'react-modal';
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

  if (!currentModal) return null;

  const { isOpen } = currentModal;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => modalStore.closeModal()}
      className={styles.modal}
      overlayClassName={styles.overlay}
      contentLabel="Modal"
      style={{
        content: {},
        overlay: {},
      }}
    >
      <button className={styles.closeButton} onClick={() => modalStore.closeModal()}>
        ×
      </button>
      {children}
    </Modal>
  );
};

export default observer(ModalComponent);
