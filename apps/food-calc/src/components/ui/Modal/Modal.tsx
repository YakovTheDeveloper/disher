import React, { useEffect, useRef } from 'react';
import s from './Modal.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton';
import { useNavigate, useLocation, useNavigationType } from 'react-router';

type Props = {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: VoidFunction;
};

const Modal = ({ isOpen, children, className, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const openedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      navigate(
        {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
        },
        { replace: false, state: { modal: true } }
      );

      openedRef.current = true;
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, navigate]);

  useEffect(() => {
    if (openedRef.current && navigationType === 'POP') {
      onClose();
      openedRef.current = false;
    }
  }, [navigationType, onClose]);

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
