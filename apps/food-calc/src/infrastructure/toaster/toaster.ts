import toast, { Toaster } from 'react-hot-toast';

interface ToasterAPI {
    success(message: string): void;
    error(message: string): void;
    info(message: string): void;
    warning(message: string): void;
}

const toaster: ToasterAPI = {
    success: (msg: string) =>
        toast.success(msg, {
            className: 'toast toast--success',
        }),

    error: (msg: string) =>
        toast.error(msg, {
            className: 'toast toast--error',
        }),

    info: (msg: string) =>
        toast(msg, {
            className: 'toast toast--info',
        }),

    warning: (msg: string) =>
        toast(msg, {
            icon: "⚠️",
            className: 'toast toast--warning',
        }),
};

export default toaster