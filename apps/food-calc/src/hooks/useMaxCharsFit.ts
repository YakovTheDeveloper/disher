import { useLayoutEffect, useRef, useState } from 'react';

export function useMaxCharsFit(text: string, deps: any[] = []) {
    const containerRef = useRef<HTMLParagraphElement | null>(null);
    const measureRef = useRef<HTMLSpanElement | null>(null);
    const [maxChars, setMaxChars] = useState<number | null>(null);

    useLayoutEffect(() => {
        if (!containerRef.current || !measureRef.current) return;

        const containerWidth = containerRef.current.clientWidth;

        // measure average character width for this font/style
        const measureSpan = measureRef.current;
        const fullText = text || '';
        const sample = fullText || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

        measureSpan.textContent = sample;
        const textWidth = measureSpan.offsetWidth;

        const avgCharWidth = textWidth / sample.length;
        const charsFit = Math.floor(containerWidth / avgCharWidth);

        setMaxChars(charsFit);
    }, deps);

    return { containerRef, measureRef, maxChars };
}
