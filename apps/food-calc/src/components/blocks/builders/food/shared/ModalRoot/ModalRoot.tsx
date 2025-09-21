import { observer } from 'mobx-react-lite';
import styles from './ModalRoot.module.scss';
import { ModalStoreUI } from '@/components/blocks/builders/food/shared/ModalStoreUI';
import Modal from '@/components/ui/Modal/Modal';
type Props<ModalVariants extends string | number> = {
  children: Partial<
    | Record<ModalVariants, React.ReactNode>
    | Record<
        ModalVariants,
        {
          component: React.ReactNode;
          onClose: () => void;
        }
      >
  >;
  modals: ModalStoreUI<ModalVariants>;
};

function ModalRoot<ModalVariants extends string | number>({
  children,
  modals,
}: Props<ModalVariants>) {
  return (
    <>
      {Object.entries(children).map(([id, Component]) =>
        Component ? (
          <Modal
            key={id}
            id={id as ModalVariants}
            currentId={modals.current}
            onClose={modals.close}
            className={styles.offset}
            backdropClassname={styles.offset}
          >
            {Component as React.ReactNode}
          </Modal>
        ) : null
      )}
    </>
  );
}

export default observer(ModalRoot);
