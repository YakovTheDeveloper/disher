import { useState } from 'react';

export function useItemCreationSteps<T extends string>(
    steps: readonly { value: T; label: string }[],
    onLastStep: () => void,
) {

    const blurActiveElement = () => {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    };

    const [activeIndex, setActiveIndex] = useState(0);
    const [maxReachedIndex, setMaxReachedIndex] = useState(0);

    const currentStep = steps[activeIndex];

    // const visibleSteps = steps.slice(0, maxReachedIndex + 1);
    const visibleSteps = steps

    const maxStepReached = maxReachedIndex >= steps.length - 1;

    const goNext = () => {
        blurActiveElement();
        setActiveIndex((prev) => {
            const next = Math.min(prev + 1, steps.length - 1);
            setMaxReachedIndex((max) => Math.max(max, next));
            return next;
        });
    };

    const setStepByValue = (value: T) => {
        blurActiveElement();
        const index = steps.findIndex((s) => s.value === value);
        setActiveIndex(index);

        // const index = steps.findIndex((s) => s.value === value);
        // if (index <= maxReachedIndex) {
        //     setActiveIndex(index);
        // }
    };

    const onStepFinish = () => {
        if (isLastStep) {
            onLastStep()
        } else {
            goNext();
        }
    };

    const isLastStep = activeIndex === steps.length - 1;
    const isLastReachedStep = maxReachedIndex === steps.length - 1;

    return {
        currentStep: currentStep.value,
        visibleSteps,
        onStepFinish,
        maxStepReached,
        goNext,
        setStepByValue,
        isLastStep,
        isLastReachedStep,
    };
}
