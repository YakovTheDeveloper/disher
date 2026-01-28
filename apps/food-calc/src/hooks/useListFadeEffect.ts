import { useEffect, useState, type RefObject } from 'react';
import { debounce } from '@/lib/debounce';
import { useReducedMotion } from './usePerformanceOptimization';

interface UseListFadeEffectOptions {
    containerRef: RefObject<HTMLElement>;
}

export const useListFadeEffect = ({ containerRef }: UseListFadeEffectOptions): string => {
    const [fadeClasses, setFadeClasses] = useState('');
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const calculateFades = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;

            // Skip if reduced motion is preferred
            if (prefersReducedMotion) {
                setFadeClasses('');
                return;
            }

            // No overflow - no fades needed
            if (scrollHeight <= clientHeight) {
                setFadeClasses('');
                return;
            }

            const isAtTop = scrollTop === 0;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1; // 1px tolerance

            let classes = '';

            if (!isAtTop) {
                classes += 'fade-top ';
            }

            if (!isAtBottom) {
                classes += 'fade-bottom';
            }

            setFadeClasses(classes.trim());
        };

        const debouncedCalculateFades = debounce(calculateFades, 100);

        // Initial calculation
        calculateFades();

        // Listen for scroll
        container.addEventListener('scroll', debouncedCalculateFades);

        // Listen for resize
        let resizeObserver: ResizeObserver | null = null;

        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(debouncedCalculateFades);
            resizeObserver.observe(container);
        } else {
            // Fallback to window resize
            window.addEventListener('resize', debouncedCalculateFades);
        }

        return () => {
            container.removeEventListener('scroll', debouncedCalculateFades);
            resizeObserver?.disconnect();
            if (!window.ResizeObserver) {
                window.removeEventListener('resize', debouncedCalculateFades);
            }
        };
    }, [containerRef, prefersReducedMotion]);

    return fadeClasses;
};