import { useEffect } from 'react';

const useOutsideClick = (
    ref: React.RefObject<HTMLElement>,
    callback: () => void
): void => {
    useEffect(() => {
        const handleOutside = (event: Event) => {
            let target: EventTarget | null = null;
            if (event instanceof MouseEvent) {
                target = event.target as Node;
            } else if (event instanceof TouchEvent) {
                target = event.touches[0]?.target as Node;
            }
            if (ref.current && target && !ref.current.contains(target)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleOutside);
        document.addEventListener('touchstart', handleOutside);
        return () => {
            document.removeEventListener('mousedown', handleOutside);
            document.removeEventListener('touchstart', handleOutside);
        };
    }, [ref, callback]);
};

export default useOutsideClick;
