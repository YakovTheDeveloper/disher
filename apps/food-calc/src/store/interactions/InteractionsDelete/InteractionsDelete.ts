import { Instance, types } from "mobx-state-tree";
import toaster from "@/infrastructure/toaster/toaster";
import { domainStore } from "@/store/store";

type DeleteAction = () => void;

const performBulkDelete = (
    action: string,
    deleteFn: DeleteAction,
    successMessage: string
): void => {
    const ids = domainStore.interactionsService.interactionsSelect.selectedIds;

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
        domainStore.interactionsService.interactionsSelect.clearSelection();
        domainStore.globalUiStore.drawerStore.close();
    }
};

export const InteractionsDelete = types.optional(types.model().actions((self) => ({
    removeDishes() {
        performBulkDelete(
            "removeDishes",
            () => domainStore.dishStore.user.removeBulk(
                domainStore.interactionsService.interactionsSelect.selectedIds
            ),
            "Блюда удалены"
        );
    },

    removeDishItems(id: string) {
        performBulkDelete(
            "removeDishItems",
            () => domainStore.dishStore.getEntity(id).removeBulk(
                domainStore.interactionsService.interactionsSelect.selectedIds
            ),
            "Элементы блюда удалены"
        );
    },

    removeScheduleFood(id: string) {
        performBulkDelete(
            "removeScheduleFood",
            () => domainStore.scheduleStore.getEntity(id).foods.removeBulk(
                domainStore.interactionsService.interactionsSelect.selectedIds
            ),
            "Еда из расписания удалена"
        );
    },

    removeScheduleEvents(id: string) {
        performBulkDelete(
            "removeScheduleEvents",
            () => domainStore.scheduleStore.getEntity(id).events.removeBulk(
                domainStore.interactionsService.interactionsSelect.selectedIds
            ),
            "События расписания удалены"
        );
    },

    removeDailyNorms() {
        performBulkDelete(
            "removeDailyNorms",
            () => domainStore.dailyNormStore.user.removeBulk(
                domainStore.interactionsService.interactionsSelect.selectedIds
            ),
            "Дневные нормы удалены"
        );
    },

    removeUserFood() {
        performBulkDelete(
            "removeUserFood",
            () => domainStore.foodStore.user.removeBulk(
                domainStore.interactionsService.interactionsSelect.selectedIds
            ),
            "Пользовательская еда удалена"
        );
    },
})), {})

export type InteractionsDeleteInstance = Instance<typeof InteractionsDelete>
