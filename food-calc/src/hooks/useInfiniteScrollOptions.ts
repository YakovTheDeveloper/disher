import { debounce } from '@/utils/debounce';
import { useEffect, useState } from 'react';

interface UseInfiniteScrollOptions {
    containerRef: React.RefObject<HTMLElement>;
    offset?: number; // Optional offset from the bottom to trigger the callback early
    onReachEnd: () => Promise<void>; // Callback function when the end is reached
}

export const useInfiniteScroll = ({
    containerRef,
    offset = 100,
    onReachEnd,
}: UseInfiniteScrollOptions): boolean => {
    const [isAtEnd, setIsAtEnd] = useState(false);

    useEffect(() => {
        // Debounced scroll handler
        const handleScroll = async () => {
            if (!containerRef.current) return;

            const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
            const reachedEnd = scrollTop + clientHeight >= scrollHeight - offset;

            setIsAtEnd(reachedEnd);
            if (reachedEnd) {
                await onReachEnd();
            }
        };

        const debouncedHandleScroll = debounce(handleScroll, 150);

        const container = containerRef.current;
        container?.addEventListener('scroll', debouncedHandleScroll);

        return () => {
            container?.removeEventListener('scroll', debouncedHandleScroll);
        };
    }, [containerRef, offset, onReachEnd]);

    return isAtEnd; // Return the current state
};