import { MotionValue } from 'framer-motion';

export interface ScreenScrollValues {
    scrollY: MotionValue<number>;
    scrollYProgress: MotionValue<number>;
    headerHeight: MotionValue<string>;
    expandedOpacity: MotionValue<number>;
    collapsedOpacity: MotionValue<number>;
    collapsedScale: MotionValue<number>;
}

export const COLLAPSE_CONFIG = {
    expandedHeight: 100,
    collapsedHeight: 60,
    collapseDistance: 100,
} as const;
