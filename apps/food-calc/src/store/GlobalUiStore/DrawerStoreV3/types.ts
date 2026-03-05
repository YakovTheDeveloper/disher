import React from 'react';

// Описываем, что любой drawer должен принимать функцию onClose с результатом R
// Все drawer должны расширять этот интерфейс, чтобы соответствовать требованиям DrawerStoreV3
export interface BaseDrawerProps<R = any> {
    onClose: (result?: R) => void;
}

// Тип для извлечения пропсов компонента без onClose
export type DrawerComponentProps<T> = T extends React.ComponentType<infer P>
    ? Omit<P, keyof BaseDrawerProps>
    : never;
