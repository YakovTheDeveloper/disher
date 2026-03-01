import { Instance, types } from "mobx-state-tree";
import toaster from "@/infrastructure/toaster/toaster";
import { domainStore } from "@/store/store";
import { InteractionsSelect } from "@/hooks/factoryHooks/useSelection";

type DeleteAction = () => void;

const performBulkDelete = (
    action: string,
    deleteFn: DeleteAction,
    successMessage: string,
    interactionsSelect: InteractionsSelect
): void => {
    const ids = interactionsSelect.selectedIds;

    if (ids.length === 0) {
        toaster.warning("Не выбрано ни одного элемента");
        return;
    }

    try {
        deleteFn();
        toaster.success(successMessage);
    } catch (error) {
        console.error(`[InteractionsDelete] ${action} failed:`, {
            count: ids.length,
            error: error instanceof Error ? error.message : String(error),
        });
        toaster.error("Ошибка при удалении");
    } finally {
        interactionsSelect.clearSelection();
        domainStore.globalUiStore.drawerStore.close();
    }
};

export const InteractionsDelete = types.optional(types.model().actions((self) => ({
    removeDishes(interactionsSelect: InteractionsSelect) {
        performBulkDelete(
            "removeDishes",
            () => domainStore.dishStore.user.removeBulk(
                interactionsSelect.selectedIds
            ),
            "Блюда удалены",
            interactionsSelect
        );
    },

    removeDishItems(id: string, interactionsSelect: InteractionsSelect) {
        performBulkDelete(
            "removeDishItems",
            () => domainStore.dishStore.getEntity(id).removeBulk(
                interactionsSelect.selectedIds
            ),
            "Элементы блюда удалены",
            interactionsSelect
        );
    },

    removeScheduleFood(id: string, interactionsSelect: InteractionsSelect) {
        performBulkDelete(
            "removeScheduleFood",
            () => domainStore.foodScheduleStore.data.get(id)?.foods.removeBulk(
                interactionsSelect.selectedIds
            ),
            "Еда из расписания удалена",
            interactionsSelect
        );
    },

    removeScheduleEvents(id: string, interactionsSelect: InteractionsSelect) {
        performBulkDelete(
            "removeScheduleEvents",
            () => domainStore.eventScheduleStore.data.get(id)?.events.removeBulk(
                interactionsSelect.selectedIds
            ),
            "События расписания удалены",
            interactionsSelect
        );
    },

    removeDailyNorms(interactionsSelect: InteractionsSelect) {
        performBulkDelete(
            "removeDailyNorms",
            () => domainStore.dailyNormStore.user.removeBulk(
                interactionsSelect.selectedIds
            ),
            "Дневные нормы удалены",
            interactionsSelect
        );
    },

    removeUserFood(interactionsSelect: InteractionsSelect) {
        performBulkDelete(
            "removeUserFood",
            () => domainStore.foodStore.user.removeBulk(
                interactionsSelect.selectedIds
            ),
            "Пользовательская еда удалена",
            interactionsSelect
        );
    },
})), {})

export type InteractionsDeleteInstance = Instance<typeof InteractionsDelete>