import React, { useEffect, useRef } from 'react';
import s from './Modal.module.scss';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import RemoveButton from '@/components/ui/RemoveButton/RemoveButton';
import { useNavigate, useLocation, useNavigationType } from 'react-router';

type ModalByOpen = {
  children: React.ReactNode;
  className?: string;
  backdropClassname?: string;
  isOpen: boolean | (() => boolean);
  onClose: VoidFunction;
};

type ModalById = {
  children: React.ReactNode;
  className?: string;
  backdropClassname?: string;
  onClose: VoidFunction;
  id: string | number;
  currentId: string | number | null;
};

type Props = ModalByOpen | ModalById;

const Modal = (props: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const openedRef = useRef(false);

  const isOpen =
    'isOpen' in props
      ? typeof props.isOpen === 'function'
        ? props.isOpen()
        : props.isOpen
      : props.id === props.currentId;

  const { children, className, onClose, backdropClassname } = props;
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      navigate(location, { replace: false, state: { modal: true } });

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
      <div className={clsx([s.backdrop, backdropClassname])} onClick={onClose} />
      <div className={clsx([s.modal, className])}>
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
