import { useEffect } from 'react';

export const useLastFocusMethod = () => {
    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                document.documentElement.dataset.focusMethod = 'key';
            }
        };

        const handlePointerdown = () => {
            document.documentElement.dataset.focusMethod = 'pointer';
        };

        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('pointerdown', handlePointerdown);

        return () => {
            document.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('pointerdown', handlePointerdown);
        };
    }, []);
};
