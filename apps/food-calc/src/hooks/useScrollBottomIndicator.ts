import { useEffect, useRef, useState } from 'react';

export function useScrollBottomIndicator(containerRef: React.RefObject<HTMLDivElement | null>) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [hasMoreBelow, setHasMoreBelow] = useState(false);
    // «Есть что скроллить» — тот же сентинел, но БЕЗ 80px pre-trigger margin:
    // с margin'ом overflow ≤ 80px читался как «скроллить нечего».
    const [canScroll, setCanScroll] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        const sentinel = sentinelRef.current;
        if (!container || !sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => setHasMoreBelow(!entry.isIntersecting),
            { root: container, threshold: 0, rootMargin: '0px 0px 80px 0px' }
        );
        const edgeObserver = new IntersectionObserver(
            ([entry]) => setCanScroll(!entry.isIntersecting),
            { root: container, threshold: 0 }
        );

        observer.observe(sentinel);
        edgeObserver.observe(sentinel);
        return () => {
            observer.disconnect();
            edgeObserver.disconnect();
        };
    }, [containerRef]);

    return { sentinelRef, hasMoreBelow, canScroll };
}
