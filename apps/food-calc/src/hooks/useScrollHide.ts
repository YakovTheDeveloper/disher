import { useMemo, useRef, useCallback, useState } from 'react';
import { useScroll, useTransform, MotionValue, UseScrollOptions, useMotionValueEvent } from 'motion/react';

export interface UseScrollHideConfig {
    collapseDistance?: number;
    threshold?: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export interface UseScrollHideResult {
    scrollYProgress: MotionValue<number>;
    isScrollingDown: boolean;
    isScrolledPastThreshold: boolean;
    scrollY: MotionValue<number>;
}

const DEFAULT_COLLAPSE_DISTANCE = 100;
const DEFAULT_THRESHOLD_RATIO = 0.3; // 50vh
const DIRECTION_CHANGE_THRESHOLD = 100; // pixels to scroll before direction can change (relaxed to prevent jitter on iOS)
const THRESHOLD_UPDATE_THROTTLE = 50; // milliseconds - throttle threshold state updates to avoid layout thrashing

/**
 * Ultra-optimized scroll-based UI control for iOS
 * 
 * Features:
 * - Minimal MotionValue overhead (only scrollYProgress for downstream consumers)
 * - State-based scroll direction tracking with relaxed threshold to prevent jitter
 * - Show/hide buttons based on scroll position and direction
 * 
 * @example
 * const { scrollYProgress, isScrollingDown, isScrolledPastThreshold } = useScrollHide({
 *   containerRef: scrollRef,
 *   collapseDistance: 300,
 * });
 */
export function useScrollHide(config: UseScrollHideConfig): UseScrollHideResult {
    const { containerRef, collapseDistance = DEFAULT_COLLAPSE_DISTANCE, threshold } = config;

    const { scrollY } = useScroll({
        container: containerRef,
    } satisfies UseScrollOptions);

    // Simple state-based direction tracking with relaxed threshold
    const [isScrollingDown, setIsScrollingDown] = useState(false);
    const [isScrolledPastThreshold, setIsScrolledPastThreshold] = useState(false);

    const lastScrollY = useRef(0);
    const lastDirectionChangeY = useRef(0);
    const lastThresholdUpdateTime = useRef(0);

    const thresholdValue = useMemo(() => {
        if (threshold !== undefined) {
            return threshold;
        }
        if (typeof window !== 'undefined') {
            return window.innerHeight * DEFAULT_THRESHOLD_RATIO;
        }
        return 400; // Fallback for SSR
    }, [threshold]);

    // Single efficient scroll listener with throttled threshold updates to prevent layout thrashing
    useMotionValueEvent(scrollY, 'change', useCallback((latest: number) => {
        const delta = latest - lastScrollY.current;
        const now = Date.now();

        // Throttle threshold state updates (150ms) to avoid excessive re-renders
        if (now - lastThresholdUpdateTime.current >= THRESHOLD_UPDATE_THROTTLE) {
            setIsScrolledPastThreshold(latest >= thresholdValue);
            lastThresholdUpdateTime.current = now;
        }

        // Only update direction if we've moved past the relaxed threshold
        if (Math.abs(latest - lastDirectionChangeY.current) >= DIRECTION_CHANGE_THRESHOLD) {
            const newDirection = delta > 0; // true = scrolling down, false = scrolling up
            setIsScrollingDown(newDirection);
            lastDirectionChangeY.current = latest;
        }

        lastScrollY.current = latest;
    }, [thresholdValue]));

    // Progress for header collapse animation (0 to 1) - used by downstream components
    const scrollYProgress = useTransform(
        scrollY,
        [0, collapseDistance],
        [0, 1],
        { clamp: true }
    );

    return {
        scrollYProgress,
        isScrollingDown,
        isScrolledPastThreshold,
        scrollY,
    };
}
