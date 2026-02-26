import { useStore } from "@/store/store";
import { createOverlayFacade, OverlayFacade } from "./OverlayFacade";
import { useMemo } from "react";

/**
 * Хук для доступа к OverlayFacade из компонентов.
 * Предоставляет интуитивные методы для открытия модалок и дроверов.
 * 
 * Внимание: modalStore методы модалок теперь пустые (TODO)
 * для перехода на роуты или ModalStoreV2
 * 
 * @example
 * ```typescript
 * const { openFormDishAdd, openConfirmationRemoveDishes } = useOverlay();
 * 
 * // Открыть модалку создания блюда (TODO: make link to new route)
 * openFormDishAdd();
 * 
 * // Открыть дровер подтверждения удаления
 * openConfirmationRemoveDishes('Удалить блюдо?', 'Это действие нельзя отменить');
 * ```
 */
export function useOverlay(): OverlayFacade {
    const { globalUiStore } = useStore();
    const { drawerStore } = globalUiStore;

    // Mock modalStore - методы теперь пустые (TODO)
    const modalStore = {
        openModal: () => {},
        closeModal: () => {},
        isModalOpen: false,
    };

    return useMemo(
        () => createOverlayFacade(modalStore as any, drawerStore),
        [drawerStore]
    );
}
