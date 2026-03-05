import { useRef, useState, useEffect } from 'react';
import { debounce } from '@/lib/debounce';

export interface UseBottomPanelsVisibilityConfig {
    isScrollingDown: boolean;
    debounceMs?: number;
}

/**
 * Native CSS-based visibility management for bottom panels
 * Optimized for iOS with debounce to prevent rapid re-renders
 * 
 * Returns true when scrolling up or at rest, false when scrolling down
 */
export function useBottomPanelsVisibility({
    isScrollingDown,
    debounceMs = 250,
}: UseBottomPanelsVisibilityConfig) {
    const [isBottomPanelsVisible, setIsBottomPanelsVisible] = useState(true);
    const debouncedSetVisibilityRef = useRef<ReturnType<typeof debounce>>();

    // Initialize debounced function
    useEffect(() => {
        debouncedSetVisibilityRef.current = debounce((visible: boolean) => {
            setIsBottomPanelsVisible(visible);
        }, debounceMs);

        return () => {
            debouncedSetVisibilityRef.current?.cancel();
        };
    }, [debounceMs]);

    // Update visibility on scroll direction change
    useEffect(() => {
        const newVisibility = !isScrollingDown;
        debouncedSetVisibilityRef.current?.(newVisibility);
    }, [isScrollingDown]);

    return { isBottomPanelsVisible };
}
