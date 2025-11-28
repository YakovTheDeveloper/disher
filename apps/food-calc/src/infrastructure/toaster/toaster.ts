import toast, { Toaster } from 'react-hot-toast';

interface Toaster {
    success(message: string): void;
    error(message: string): void;
    info(message: string): void;
    warning(message: string): void;
}

const toaster: Toaster = {
    success: (msg: string) =>
        toast.success(msg, {
            style: {
                background: "#10b981",
                color: "white",
            },
        }),

    error: (msg: string) =>
        toast.error(msg, {
            style: {
                background: "#ef4444",
                color: "white",
            },
        }),

    info: (msg: string) =>
        toast(msg, {
            style: {
                background: "#3b82f6",
                color: "white",
            },
        }),

    warning: (msg: string) =>
        toast(msg, {
            icon: "⚠️",
            style: {
                background: "#f59e0b",
                color: "white",
            },
        }),
};

export default toaster