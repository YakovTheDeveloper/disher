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
                background: "rgba(16, 185, 129, 0.95)",
                color: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                fontSize: "14px",
                fontWeight: "500",
                padding: "12px 16px",
            },
        }),

    error: (msg: string) =>
        toast.error(msg, {
            style: {
                background: "rgba(239, 68, 68, 0.95)",
                color: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                fontSize: "14px",
                fontWeight: "500",
                padding: "12px 16px",
            },
        }),

    info: (msg: string) =>
        toast(msg, {
            style: {
                background: "rgba(59, 130, 246, 0.95)",
                color: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                fontSize: "14px",
                fontWeight: "500",
                padding: "12px 16px",
            },
        }),

    warning: (msg: string) =>
        toast(msg, {
            icon: "⚠️",
            style: {
                background: "rgba(245, 158, 11, 0.95)",
                color: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                fontSize: "14px",
                fontWeight: "500",
                padding: "12px 16px",
            },
        }),
};

export default toaster