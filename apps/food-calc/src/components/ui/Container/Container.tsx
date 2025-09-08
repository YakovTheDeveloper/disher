import React from 'react';
import s from './Container.module.css';
import clsx from 'clsx';

type Props = {
    children: React.ReactNode;
    vertical?: boolean;
    className?: string;
    boxShadow?: boolean;
    size?: 'small' | 'medium'
};

const Container = ({ children, vertical, boxShadow, size = 'small', className }: Props) => {
    const classList = clsx([
        s.container,
        vertical && s.vertical,
        boxShadow && s.boxShadow,
        s[size],
        className,
    ]);

    return <div className={classList}>{children}</div>;
};

export default Container;
