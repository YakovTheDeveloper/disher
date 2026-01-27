import { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 * Respects system accessibility settings
 */
export const useReducedMotion = (): boolean => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Check system preference
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        // Listen for changes
        const handleChange = (e: MediaQueryListEvent) => {
            setPrefersReducedMotion(e.matches);
        };

        mediaQuery.addEventListener('change', handleChange);

        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    return prefersReducedMotion;
};

/**
 * Hook to pause animations when component is off-screen (IntersectionObserver)
 * Improves performance by not rendering hidden content
 */
export const useVisibilityOptimization = (elementRef: React.RefObject<HTMLElement>) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                threshold: 0.1,
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, [elementRef]);

    return isVisible;
};

/**
 * Detect if device is low-end (reduced performance capability)
 * Based on GPU/CPU capabilities or device memory
 */
export const useLowPowerDevice = (): boolean => {
    const [isLowPower, setIsLowPower] = useState(false);

    useEffect(() => {
        // Check device memory if available
        const hasDeviceMemory = 'deviceMemory' in navigator;
        const hasConnection = 'connection' in navigator;

        let lowPower = false;

        if (hasDeviceMemory) {
            const deviceMemory = (navigator as any).deviceMemory;
            lowPower = deviceMemory < 4; // Less than 4GB
        }

        if (hasConnection) {
            const connection = (navigator as any).connection;
            if (connection?.saveData) {
                lowPower = true; // User has data saver enabled
            }
        }

        setIsLowPower(lowPower);
    }, []);

    return isLowPower;
};

/**
 * Check if device is in low power mode (battery saver)
 */
export const useLowBatteryMode = (): boolean => {
    const [isLowBattery, setIsLowBattery] = useState(false);

    useEffect(() => {
        const updateBatteryStatus = (battery: BatteryManager) => {
            // Consider low battery if below 20% and discharging
            setIsLowBattery(battery.level < 0.2 && !battery.charging);
        };

        // Battery API (limited support)
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: BatteryManager) => {
                updateBatteryStatus(battery);
                battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
            });
        }
    }, []);

    return isLowBattery;
};
