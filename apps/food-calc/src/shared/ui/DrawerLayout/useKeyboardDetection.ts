import { useState, useEffect } from 'react';

export const useKeyboardDetection = () => {
    const [data, setData] = useState({
        keyboardVisible: false,
        keyboardHeight: 0,
        currentHeight: window.innerHeight,
    });

    useEffect(() => {
        let hasInputFocus = false;
        let focusBlurTimeout: NodeJS.Timeout;

        // Способ 1: Отслеживание focus/blur на input элементах (надежно на Android)
        const handleInputFocus = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
                hasInputFocus = true;
                clearTimeout(focusBlurTimeout);
                setData((prev) => ({
                    ...prev,
                    keyboardVisible: true,
                }));
            }
        };

        const handleInputBlur = (e: Event) => {
            const target = e.target as HTMLElement;
            if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
                hasInputFocus = false;
                focusBlurTimeout = setTimeout(() => {
                    if (!hasInputFocus) {
                        setData((prev) => ({
                            ...prev,
                            keyboardVisible: false,
                            keyboardHeight: 0,
                        }));
                        document.documentElement.style.setProperty('--keyboard-height', '0px');
                    }
                }, 150);
            }
        };

        document.addEventListener('focusin', handleInputFocus);
        document.addEventListener('focusout', handleInputBlur);

        // Способ 2: Отслеживание изменения visualViewport даже с overlays-content
        const handleResize = () => {
            if (!window.visualViewport) return;

            const vh = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            const heightDiff = Math.max(0, windowHeight - vh);

            // На Android с overlays-content визуальный viewport все равно меняется немного
            // Проверяем наличие активного фокуса или разницу в высоте
            if (heightDiff > 50 || hasInputFocus) {
                document.documentElement.style.setProperty('--keyboard-height', `${Math.max(heightDiff, 0)}px`);
            } else {
                document.documentElement.style.setProperty('--keyboard-height', '0px');
            }
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        handleResize(); // Инициализация

        // Способ 3: VirtualKeyboard API если доступен
        if ('virtualKeyboard' in navigator) {
            try {
                const vk = (navigator as any).virtualKeyboard;
                vk.overlaysContent = true;

                const handleGeometryChange = () => {
                    const { height } = vk.boundingRect;

                    if (height > 0) {
                        document.documentElement.style.setProperty('--keyboard-height', `${height}px`);
                        setData((prev) => ({
                            ...prev,
                            keyboardVisible: true,
                            keyboardHeight: height,
                        }));
                    }
                };

                vk.addEventListener('geometrychange', handleGeometryChange);
            } catch (e) {
                console.warn('[Keyboard] VirtualKeyboard API error:', e);
            }
        }

        return () => {
            document.removeEventListener('focusin', handleInputFocus);
            document.removeEventListener('focusout', handleInputBlur);
            window.visualViewport?.removeEventListener('resize', handleResize);
            clearTimeout(focusBlurTimeout);
        };
    }, []);

    return data;
};
