import { useMemo } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export type PerformanceTier = 'low' | 'medium' | 'high';
export type NavigationDirection = 'forward' | 'back';

interface TransitionConfig {
    duration: number;
    ease: [number, number, number, number];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variants: Record<string, any>;
    reducedMotion: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fadeVariants: Record<string, any> = {
    forward: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    back: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slideVariants: Record<string, any> = {
    forward: {
        initial: { x: '4%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '-4%', opacity: 0 },
    },
    back: {
        initial: { x: '-4%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '4%', opacity: 0 },
    },
};

const getPerformanceTier = (): PerformanceTier => {
    if (typeof window === 'undefined') return 'high';

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    );

    const cores = navigator.hardwareConcurrency || 4;
    const isLowEnd = cores <= 4 || isMobile;

    return isLowEnd ? 'low' : 'high';
};

const getTransitionConfig = (tier: PerformanceTier): TransitionConfig => {
    const configs: Record<PerformanceTier, TransitionConfig> = {
        low: {
            duration: 0.15,
            ease: [0.25, 0.1, 0.25, 1],
            variants: fadeVariants,
            reducedMotion: true,
        },
        medium: {
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1],
            variants: slideVariants,
            reducedMotion: false,
        },
        high: {
            duration: 0.25,
            ease: [0.32, 0.72, 0, 1],
            variants: slideVariants,
            reducedMotion: false,
        },
    };

    return configs[tier];
};

export const usePageTransitionConfig = () => {
    const location = useLocation();
    const navigationType = useNavigationType();

    const tier = useMemo(() => getPerformanceTier(), []);
    const config = useMemo(() => getTransitionConfig(tier), [tier]);

    const direction: NavigationDirection = useMemo(() => {
        if (navigationType === 'POP') return 'back';
        return 'forward';
    }, [navigationType]);

    const variants = useMemo(() => {
        const baseVariants = config.variants;
        return {
            forward: baseVariants.forward,
            back: baseVariants.back,
        };
    }, [config.variants]);

    return {
        tier,
        direction,
        duration: config.duration,
        ease: config.ease,
        variants,
        reducedMotion: config.reducedMotion,
        locationKey: location.pathname,
    };
};