import React, { useEffect, useRef } from 'react'
import s from './Modal.module.css'
import { uiStore } from '@/store/rootStore';
import useOutsideClick from '@/hooks/useOutsideClick';
import clsx from 'clsx';


type Props = {
    children: React.ReactNode
    className?: string,
    isOpen: boolean
}

const Modal = ({ isOpen, children, className }: Props) => {
    const ref: React.Ref<HTMLDialogElement> = useRef(null);

    const { closeModal } = uiStore.modal
    // useOutsideClick(ref, closeModal)

    useEffect(() => {
        if (isOpen) {
            ref.current?.showModal();
        } else {
            ref.current?.close();
        }
    }, [isOpen]);

    const onMouseDown = (event: React.MouseEvent<HTMLDialogElement, MouseEvent>) => {
        if (event.target === ref.current) {
            closeModal()
        }
    }


    return (
        <dialog
            ref={ref}
            onCancel={closeModal}
            onMouseDown={onMouseDown}
            className={clsx(s.modal, className)}
        >

            {/* <button onClick={closeModal}>
                Close
            </button> */}
            <div className={s.inner}>
                {children}
            </div>
            <div className={s.background} />
        </dialog>
    );
}

export default Modal