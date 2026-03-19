import { useRef, useState, useEffect } from 'react';

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
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
        const newVisibility = !isScrollingDown;
        timerRef.current = setTimeout(() => {
            setIsBottomPanelsVisible(newVisibility);
        }, debounceMs);

        return () => {
            if (timerRef.current !== null) clearTimeout(timerRef.current);
        };
    }, [isScrollingDown, debounceMs]);

    return { isBottomPanelsVisible };
}
