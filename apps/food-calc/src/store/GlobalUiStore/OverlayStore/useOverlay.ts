import { useStore } from "@/store/store";
import { createOverlayFacade, OverlayFacade } from "./OverlayFacade";
import { useMemo } from "react";

/**
 * Хук для доступа к OverlayFacade из компонентов.
 * Предоставляет интуитивные методы для открытия модалок и дроверов.
 * 
 * @example
 * ```typescript
 * const { openFormDishAdd, openConfirmationRemoveDishes } = useOverlay();
 * 
 * // Открыть модалку создания блюда
 * openFormDishAdd();
 * 
 * // Открыть дровер подтверждения удаления
 * openConfirmationRemoveDishes('Удалить блюдо?', 'Это действие нельзя отменить');
 * ```
 */
export function useOverlay(): OverlayFacade {
    const { globalUiStore } = useStore();
    const { modalStore, drawerStore } = globalUiStore;

    return useMemo(
        () => createOverlayFacade(modalStore, drawerStore),
        [modalStore, drawerStore]
    );
}
