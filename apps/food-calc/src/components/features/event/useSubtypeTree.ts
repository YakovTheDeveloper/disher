import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EventSubtype } from '@/domain/schedule/scheduleEvent/eventTypes';
import { SubtypeOption, StackItem } from './types';

/**
 * Вспомогательная функция для получения опции по цепочке значений
 */
function getOptionByChain(
    options: SubtypeOption[],
    chain: EventSubtype[]
): SubtypeOption | undefined {
    if (chain.length === 0) return undefined;
    const currentValue = chain[0];
    const currentOption = options.find((opt) => opt.value === currentValue);
    if (!currentOption) return undefined;
    if (chain.length === 1) return currentOption;
    return getOptionByChain(currentOption.children || [], chain.slice(1));
}

interface UseSubtypeTreeProps {
    options: SubtypeOption[];
    selectedChain: EventSubtype[];
    maxDepth: number;
    onChange: (newChain: EventSubtype[]) => void;
}

interface UseSubtypeTreeReturn {
    /** Текущий уровень вложенности */
    currentLevel: number;
    /** Достигнута ли максимальная глубина */
    isMaxDepthReached: boolean;
    /** Опции для текущего уровня */
    currentOptions: SubtypeOption[];
    /** Текущее выбранное значение на этом уровне */
    currentValue: EventSubtype | null;
    /** Элементы стека breadcrumbs */
    stackItems: StackItem[];
    /** Выбрать значение на текущем уровне */
    selectValue: (value: EventSubtype) => void;
    /** Перейти к определённому уровню в стеке */
    navigateToStackIndex: (index: number) => void;
    /** Удалить элемент из стека */
    removeFromStack: (index: number) => void;
}

/**
 * Hook для управления логикой древовидного селектора подтипов
 */
export function useSubtypeTree({
    options,
    selectedChain,
    maxDepth,
    onChange,
}: UseSubtypeTreeProps): UseSubtypeTreeReturn {
    const { t } = useTranslation();

    const currentLevel = selectedChain.length;
    const isMaxDepthReached = currentLevel >= maxDepth;

    // Получаем опции для текущего уровня
    const currentOptions = useMemo(() => {
        if (currentLevel === 0) return options;
        return (
            getOptionByChain(options, selectedChain.slice(0, currentLevel))?.children || []
        );
    }, [currentLevel, options, selectedChain]);

    const currentValue = selectedChain[currentLevel] || null;

    // Формируем элементы стека с переводами
    const stackItems: StackItem[] = useMemo(() => {
        return selectedChain.map((value, index) => {
            const chainPart = selectedChain.slice(0, index + 1);
            const option = getOptionByChain(options, chainPart);
            return {
                value,
                label: option ? t(option.labelKey) : value,
                depth: index,
            };
        });
    }, [options, selectedChain, t]);

    const selectValue = useCallback(
        (value: EventSubtype) => {
            const newChain = selectedChain.slice(0, currentLevel).concat(value);
            onChange(newChain);
        },
        [currentLevel, onChange, selectedChain]
    );

    const navigateToStackIndex = useCallback(
        (index: number) => {
            const newChain = selectedChain.slice(0, index + 1);
            onChange(newChain);
        },
        [onChange, selectedChain]
    );

    const removeFromStack = useCallback(
        (index: number) => {
            const newChain = selectedChain.slice(0, index);
            onChange(newChain);
        },
        [onChange, selectedChain]
    );

    return {
        currentLevel,
        isMaxDepthReached,
        currentOptions,
        currentValue,
        stackItems,
        selectValue,
        navigateToStackIndex,
        removeFromStack,
    };
}
