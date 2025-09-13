import React, { useEffect } from 'react';
import s from './Modal.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton';

type Props = {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: VoidFunction;
};

const Modal = ({ isOpen, children, className, onClose }: Props) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className={s.backdrop} onClick={onClose} />
      <div className={clsx(s.modal, className)}>
        <div className={s.inner}>
          <header>
            <RemoveButton onClick={onClose} />
          </header>
          {children}
        </div>
      </div>
    </>
  );
};

export default observer(Modal);

// <AnimatePresence>
//   {isOpen && (
//     <motion.aside
//       initial={{ x: '100%' }}
//       animate={{ x: 0 }}
//       exit={{ x: '100%' }}
//       transition={{ duration: 0.2, ease: 'easeInOut' }}
//     >
//       <div className={clsx(s.modal, className)}>
//         <div className={s.inner}>
//           <header>
//             <RemoveButton onClick={onClose} />
//           </header>
//           {children}
//         </div>
//       </div>
//     </motion.aside>
//   )}
// </AnimatePresence>
