import { useState } from 'react';

export function useTabs<T extends string>(
    tabs: readonly { value: T; label: string }[],
    defaultTab?: T
) {

    const blurActiveElement = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    const [activeIndex, setActiveIndex] = useState(() => {
        if (defaultTab) {
            const index = tabs.findIndex((tab) => tab.value === defaultTab);
            if (index !== -1) return index;
        }
        return 0;
    });

    const currentStep = tabs[activeIndex];

    const goNext = () => {
        blurActiveElement();
        setActiveIndex((prev) => {
            const next = Math.min(prev + 1, tabs.length - 1);
            return next;
        });
    };

    const setTab = (value: T) => {
        blurActiveElement();
        const index = tabs.findIndex((s) => s.value === value);
        setActiveIndex(index);
    };

    return {
        currentTab: currentStep.value,
        goNext,
        setTab,
    };
}
