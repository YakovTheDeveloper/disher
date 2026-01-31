import { getRoot, Instance, types } from "mobx-state-tree";
import toaster from "@/infrastructure/toaster/toaster";
import { InteractionsEnv } from "@/store/interactions/InteractionsService";
import { DrawerTypesV2 } from "@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types";
import { domainStore } from "@/store/store";

export const InteractionsDelete = types.optional(types.model().actions((self) => ({
    removeDishes() {
        const ids = domainStore.interactionsService.interactionsSelect.selectedIds;
        domainStore.dishStore.user.removeBulk(ids);
        domainStore.interactionsService.interactionsSelect.clearSelection();
        toaster.success("Блюда удалены");
        domainStore.globalUiStore.drawerStore.close();
    },

    removeDishItems(id: string) {
        const ids = domainStore.interactionsService.interactionsSelect.selectedIds;
        domainStore.dishStore.getEntity(id).removeBulk(ids);
        domainStore.interactionsService.interactionsSelect.clearSelection();
        toaster.success("Элементы блюда удалены");
        domainStore.globalUiStore.drawerStore.close();
    },

    removeScheduleFood(id: string) {
        const ids = domainStore.interactionsService.interactionsSelect.selectedIds;
        domainStore.scheduleStore.getEntity(id).foods.removeBulk(ids);
        domainStore.interactionsService.interactionsSelect.clearSelection();
        toaster.success("Еда из расписания удалена");
        domainStore.globalUiStore.drawerStore.close();
    },

    removeScheduleEvents(id: string) {
        const ids = domainStore.interactionsService.interactionsSelect.selectedIds;
        domainStore.scheduleStore.getEntity(id).events.removeBulk(ids);
        domainStore.interactionsService.interactionsSelect.clearSelection();
        toaster.success("События расписания удалены");
        domainStore.globalUiStore.drawerStore.close();
    },

    removeDailyNorms() {
        const ids = domainStore.interactionsService.interactionsSelect.selectedIds;
        domainStore.dailyNormStore.user.removeBulk(ids);
        // удаляемая норма может быть применена на данный момент, тогда установить стандартную норму перед удалением
        domainStore.interactionsService.interactionsSelect.clearSelection();
        toaster.success("Дневные нормы удалены");
        domainStore.globalUiStore.drawerStore.close();
    },

    removeUserFood() {
        const ids = domainStore.interactionsService.interactionsSelect.selectedIds;
        domainStore.foodStore.user.removeBulk(ids);
        domainStore.interactionsService.interactionsSelect.clearSelection();
        toaster.success("Пользовательская еда удалена");
        domainStore.globalUiStore.drawerStore.close();
    },
})), {})

export type InteractionsDeleteInstance = Instance<typeof InteractionsDelete>
