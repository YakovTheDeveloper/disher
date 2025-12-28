import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';
import { useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal/Modal';
import styles from './ModalRoot.module.scss';
import { useDailyScheduleModals } from '@/components/features/builders/food/ScheduleBuilder/modalContext';
import { Drawer } from '@/components/ui/Drawer';

type Props<ModalVariants extends string | number> = {
  children: Partial<
    | Record<ModalVariants, React.ReactNode>
    | Record<ModalVariants, { component: React.ReactNode; onClose: () => void }>
  >;
};

function ModalRoot<ModalVariants extends string | number>({ children }: Props<ModalVariants>) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const baselineRef = useRef<string | null>(null);
  const modals = useDailyScheduleModals();

  const modalFromUrl = params.get('modal') as ModalVariants | null;

  const getBaselineUrl = () => {
    const newParams = new URLSearchParams(params);
    newParams.delete('modal');
    return location.pathname + (newParams.toString() ? `?${newParams.toString()}` : '');
  };

  useEffect(() => {
    if (!baselineRef.current) {
      baselineRef.current = getBaselineUrl();
      navigate(baselineRef.current, { replace: true });
    }
  }, []);

  const isMobile = true;

  const currentChild = modalFromUrl ? children[modalFromUrl] : null;

  return (
    <Drawer open={!!currentChild} onOpenChange={modals.close}>
      {currentChild as React.ReactNode}
    </Drawer>
  );
  // return createPortal(
  //   <>
  //     {Object.entries(children).map(([id, Component]) =>
  //       Component ? (
  //         !isMobile ? (
  //           <Modal
  //             key={id}
  //             id={id as ModalVariants}
  //             currentId={modalFromUrl}
  //             onClose={modals.close}
  //             className={styles.offset}
  //             backdropClassname={styles.offset}
  //           >
  //             {Component as React.ReactNode}
  //           </Modal>
  //         ) : (
  //           <Drawer open={modalFromUrl === id} onOpenChange={modals.close}>
  //             {Component as React.ReactNode}
  //           </Drawer>
  //         )
  //       ) : null
  //     )}
  //   </>,
  //   document.body
  // );
}

export default ModalRoot;
