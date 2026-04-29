import { toast } from 'sonner';
import { router } from '@/app/router';

export interface ToastAction {
    label: string;
    href: string;
}

export interface ToastOptions {
    action?: ToastAction;
}

function buildAction(action?: ToastAction) {
    if (!action) return undefined;
    return {
        label: action.label,
        onClick: () => {
            console.warn('[debug toaster] action click → navigate', action.href);
            const result = router.navigate(action.href);
            console.warn('[debug toaster] navigate result', result);
        },
    };
}

interface ToasterAPI {
    success(message: string, options?: ToastOptions): void;
    error(message: string, options?: ToastOptions): void;
    info(message: string, options?: ToastOptions): void;
    warning(message: string, options?: ToastOptions): void;
}

const toaster: ToasterAPI = {
    success: (msg, options) =>
        toast.success(msg, {
            action: buildAction(options?.action),
        }),

    error: (msg, options) =>
        toast.error(msg, {
            action: buildAction(options?.action),
        }),

    info: (msg, options) =>
        toast.info(msg, {
            action: buildAction(options?.action),
        }),

    warning: (msg, options) =>
        toast.warning(msg, {
            action: buildAction(options?.action),
        }),
};

export default toaster;
