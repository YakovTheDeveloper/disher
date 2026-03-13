import { useEffect, useRef, useState } from 'react';

export function useScrollBottomIndicator(containerRef: React.RefObject<HTMLDivElement | null>) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [hasMoreBelow, setHasMoreBelow] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        const sentinel = sentinelRef.current;
        if (!container || !sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => setHasMoreBelow(!entry.isIntersecting),
            { root: container, threshold: 0 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [containerRef]);

    return { sentinelRef, hasMoreBelow };
}
