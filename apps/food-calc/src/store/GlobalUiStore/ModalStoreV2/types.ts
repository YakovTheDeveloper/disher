import React from 'react';

// Описываем, что любая модалка должна принимать функцию onClose с результатом R
// Все модалки должны расширять этот интерфейс, чтобы соответствовать требованиям ModalStoreV2
export interface BaseModalProps<R = any> {
  onClose: (result?: R) => void;
}

// Тип для извлечения пропсов компонента без onClose
export type ModalComponentProps<T> = T extends React.ComponentType<infer P>
  ? Omit<P, keyof BaseModalProps>
  : never;
