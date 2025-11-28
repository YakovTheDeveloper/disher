import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router';
import { useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal/Modal';
import styles from './ModalRoot.module.scss';
import { useDailyScheduleModals } from '@/components/blocks/builders/food/ScheduleBuilder/modalContext';

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

  // Чистый URL без модалки
  const getBaselineUrl = () => {
    const newParams = new URLSearchParams(params);
    newParams.delete('modal');
    return location.pathname + (newParams.toString() ? `?${newParams.toString()}` : '');
  };

  // Устанавливаем baseline один раз при монтировании
  useEffect(() => {
    if (!baselineRef.current) {
      baselineRef.current = getBaselineUrl();
      navigate(baselineRef.current, { replace: true });
    }
  }, []);

  // Открытие/закрытие модалки
  // useEffect(() => {
  //   if (!modalFromUrl) return; // закрытие обрабатываем только кнопкой

  //   const modalParams = new URLSearchParams(params);
  //   modalParams.set('modal', modalFromUrl.toString());
  //   const modalUrl = location.pathname + '?' + modalParams.toString();

  //   navigate(modalUrl, { replace: false });
  // }, [modalFromUrl]);

  return createPortal(
    <>
      {Object.entries(children).map(([id, Component]) =>
        Component ? (
          <Modal
            key={id}
            id={id as ModalVariants}
            currentId={modalFromUrl}
            onClose={modals.close}
            className={styles.offset}
            backdropClassname={styles.offset}
          >
            {Component as React.ReactNode}
          </Modal>
        ) : null
      )}
    </>,
    document.body
  );
}

export default ModalRoot;
