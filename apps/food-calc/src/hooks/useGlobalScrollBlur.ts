import { useEffect } from 'react';
/**
 * Глобальный обработчик скролла - убирает фокус с инпутов при скролле
 * Нужно для мобильных устройств, чтобы клавиатура скрывалась при пролистывании списка
 * Использует touchmove вместо scroll, т.к. scroll на window не срабатывает при скролле внутри контейнеров
 */
export function useGlobalScrollBlur() {
    useEffect(() => {
        const handleScroll = () => {
            const activeElement = document.activeElement;

            if (
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement
            ) {
                activeElement.blur();
            }
        };

        window.addEventListener('touchmove', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('touchmove', handleScroll);
        };
    }, []);
}
