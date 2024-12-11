import React, { useEffect, useRef } from 'react'
import s from './Modal.module.scss'
import { uiStore } from '@/store/rootStore';
import useOutsideClick from '@/hooks/useOutsideClick';


type Props = {
    children: React.ReactNode
    isOpen: boolean
}

const Modal = ({ isOpen, children }: Props) => {
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
            className={s.modal}
        >

            {/* <button onClick={closeModal}>
                Close
            </button> */}
            <div className={s.inner}>
                {children}
            </div>
        </dialog>
    );
}

export default Modal