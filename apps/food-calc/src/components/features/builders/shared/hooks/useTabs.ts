import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigationType } from 'react-router';

const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
};

export function useTabs<T extends string>(
    tabs: readonly { value: T; label: string; disabled?: boolean }[],
    defaultTab?: T,
) {
    const location = useLocation();
    const navigationType = useNavigationType();

    const [activeIndex, setActiveIndex] = useState(() => {
        const storageKey = `tabs:${location.pathname}`;

        if (navigationType === 'POP') {
            const savedTab = sessionStorage.getItem(storageKey);

            if (savedTab) {
                const index = tabs.findIndex(
                    tab => tab.value === savedTab && !tab.disabled
                );

                if (index !== -1) {
                    return index;
                }
            }
        }

        if (defaultTab) {
            const index = tabs.findIndex(tab => tab.value === defaultTab);
            if (index !== -1) return index;
        }

        return 0;
    });

    const [direction, setDirection] = useState<1 | -1>(1);

    const tabToIndex = useMemo(() => {
        const mapping: Record<string, number> = {};
        tabs.forEach((tab, index) => {
            mapping[tab.value] = index;
        });
        return mapping;
    }, [tabs]);

    const currentStep = tabs[activeIndex];

    const goNext = useCallback(() => {
        blurActiveElement();
        let nextIndex = 0;
        setActiveIndex((prev) => {
            const next = Math.min(prev + 1, tabs.length - 1);
            nextIndex = next;
            return next;
        });
        setDirection(1);
        return nextIndex;
    }, [tabs.length]);

    const setTab = useCallback((value: T) => {
        blurActiveElement();
        const index = tabs.findIndex((s) => s.value === value);
        const currentIndex = activeIndex;
        setDirection(index > currentIndex ? 1 : -1);
        setActiveIndex(index);

        if (typeof window !== 'undefined') {
            const storageKey = `tabs:${location.pathname}`;
            sessionStorage.setItem(storageKey, value);
        }
    }, [tabs, activeIndex, location.pathname]);

    // useEffect(() => {
    //     return () => {
    //         sessionStorage.setItem(
    //             `tabs:${location.pathname}`,
    //             tabs[activeIndex]?.value
    //         );
    //     };
    // }, [activeIndex]);

    return {
        currentTab: currentStep.value,
        selectedIndex: activeIndex,
        goNext,
        setTab,
        direction,
        tabToIndex,
    };
}