import { useEffect, type RefObject } from 'react';
import { userAgentInfo } from './useUserAgentDetection';

/**
 * Hook to enable autofocus on iOS devices by working around Safari's keyboard restrictions.
 * Uses industry-standard temp input trick based on best practices from top web apps.
 */
export const useIOSAutofocus = (ref: RefObject<HTMLInputElement>, autoFocus?: boolean) => {
    const isIOS = userAgentInfo.isIOS;

    useEffect(() => {
        if (!autoFocus || !isIOS) return;

        // iOS hack: create temporary input to trigger keyboard context
        // Best practices: position relative to viewport, extended delays, simulate touch
        const timeoutId = setTimeout(() => {
            const tempInput = document.createElement('input');
            tempInput.type = 'text';
            tempInput.inputMode = 'text';
            tempInput.style.cssText =
                'position: fixed; top: -10px; left: -10px; width: 1px; height: 1px; border: none; outline: none; background: transparent; opacity: 0; pointer-events: none;';
            document.body.appendChild(tempInput);
            tempInput.focus();

            setTimeout(() => {
                tempInput.remove();
                if (ref.current) {
                    // Simulate touch event to bypass iOS gesture restrictions
                    ref.current.dispatchEvent(new Event('touchstart', { bubbles: true }));
                    ref.current.focus();
                    // Delay select to ensure focus stability
                    setTimeout(() => ref.current?.select(), 50);
                }
            }, 100);
        }, 150);

        return () => clearTimeout(timeoutId);
    }, [autoFocus, isIOS, ref]);
};
