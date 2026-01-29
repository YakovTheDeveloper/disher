import { useLocalObservable } from 'mobx-react-lite';
import { useTabs } from './useTabs';
import { highlightListItem } from '@/infrastructure/emitter/emitter';

// ============================================
// Types
// ============================================

export type Variant = 'add' | 'edit';

export interface TabConfig<T extends string> {
    value: T;
    label: string;
    alternativeLabel?: string;
    disabled?: boolean;
}

export interface CreationWizardState {
    searchFocusState: {
        isSearchFocused: boolean;
        setSearchFocused: (value: boolean) => void;
    };
}

// ============================================
// Hook
// ============================================

/**
 * Universal hook for creation/editing wizard components.
 * Provides common patterns for modal/drawer-based entity management.
 *
 * @param variant - 'add' | 'edit' - controls behavior and default tabs
 * @param options - Configuration options
 * @returns Wizard state and handlers
 */
type JustCreatedItemId = string

export function useEntityItemWizard<T extends string>(
    variant: Variant,
    options: {
        defaultTab?: T;
        baseTabs: readonly TabConfig<T>[];
        onFinish: () => JustCreatedItemId;
        onAfterFinish: () => void;
        enableHashSync?: boolean;
    }
) {
    const { defaultTab, baseTabs, onFinish, onAfterFinish, enableHashSync } = options;

    // ========================================
    // Search Focus State (common)
    // Used to hide header when search is focused
    // ========================================
    const searchFocusState = useLocalObservable(() => ({
        isSearchFocused: false,
        setSearchFocused(value: boolean) {
            this.isSearchFocused = value;
        },
    }));

    // ========================================
    // Tabs Configuration (variant-specific)
    // ========================================
    const infoTab: TabConfig<'info'> = {
        value: 'info',
        label: 'info',
        alternativeLabel: '',
    };

    const tabs = variant === 'edit'
        ? [infoTab, ...baseTabs] as readonly TabConfig<T | 'info'>[]
        : baseTabs;

    const { currentTab, goNext, setTab, direction } = useTabs(
        tabs,
        defaultTab as T | undefined,
        { enableHashSync }
    );

    // ========================================
    // Finish Handler (variant-specific behavior)
    // ========================================
    const handleFinish = () => {
        const itemId = onFinish();
        setTimeout(() => highlightListItem(itemId), 100)
        onAfterFinish()
    };

    const handleNextStep = () => {
        if (variant === 'add') {
            setTimeout(() => goNext(), 100);

        }
        if (variant === 'edit') {
            setTimeout(() => handleFinish(), 100);
        }
    };

    return {
        // State
        searchFocusState,
        currentTab,
        direction,

        // Handlers
        setTab,
        goNext,
        handleFinish,
        handleNextStep,

        // Helpers
        isEdit: variant === 'edit',
        isAdd: variant === 'add',
    };
}

// ============================================
// Type Guards & Helpers
// ============================================

export function isEditVariant(variant: Variant): variant is 'edit' {
    return variant === 'edit';
}

export function isAddVariant(variant: Variant): variant is 'add' {
    return variant === 'add';
}
