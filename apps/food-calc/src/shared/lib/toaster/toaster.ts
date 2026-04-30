import { toast } from 'sonner';
import { router } from '@/app/router';
import type { ErrorKind } from '@/shared/lib/errors/classify';

export interface ToastAction {
    label: string;
    href: string;
}

export interface ToastOptions {
    action?: ToastAction;
}

export interface ErrorToastOptions extends ToastOptions {
    /**
     * Classified kind for the error. Drives toast duration and (in dev) the
     * `[kind status code]` debug prefix. The visible message is whatever the
     * caller passes in — pass `defaultUserMessage(kind)` for the localized text.
     */
    kind?: ErrorKind;
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

// Network/timeout flap a lot — keep their toast short so it doesn't stack.
// Auth/validation are user-actionable — keep them around longer.
function durationFor(kind?: ErrorKind): number | undefined {
    if (!kind) return undefined;
    switch (kind.kind) {
        case 'network':
        case 'timeout':
            return 3000;
        case 'auth':
        case 'validation':
            return 6000;
        default:
            return undefined;
    }
}

interface ToasterAPI {
    success(message: string, options?: ToastOptions): void;
    error(message: string, options?: ErrorToastOptions): void;
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
            duration: durationFor(options?.kind),
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
