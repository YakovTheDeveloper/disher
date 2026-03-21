import React from 'react';
import toast from 'react-hot-toast';
import { router } from '@/app/router';

export interface ToastAction {
    label: string;
    href: string;
}

export interface ToastOptions {
    action?: ToastAction;
}

function renderContent(message: string, action?: ToastAction): string | React.ReactElement {
    if (!action) return message;
    return React.createElement(
        'span',
        { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
        message,
        ' ',
        React.createElement(
            'a',
            {
                href: action.href,
                style: { color: 'inherit', fontWeight: 600, textDecoration: 'underline', whiteSpace: 'nowrap' },
                onClick: (e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.navigate(action.href);
                    toast.dismiss();
                },
            },
            action.label
        )
    );
}

interface ToasterAPI {
    success(message: string, options?: ToastOptions): void;
    error(message: string, options?: ToastOptions): void;
    info(message: string, options?: ToastOptions): void;
    warning(message: string, options?: ToastOptions): void;
}

const toaster: ToasterAPI = {
    success: (msg, options) =>
        toast.success(renderContent(msg, options?.action), {
            className: 'toast toast--success',
        }),

    error: (msg, options) =>
        toast.error(renderContent(msg, options?.action), {
            className: 'toast toast--error',
        }),

    info: (msg, options) =>
        toast(renderContent(msg, options?.action), {
            className: 'toast toast--info',
        }),

    warning: (msg, options) =>
        toast(renderContent(msg, options?.action), {
            icon: '⚠️',
            className: 'toast toast--warning',
        }),
};

export default toaster;
