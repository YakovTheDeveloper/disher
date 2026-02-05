import { DrawerTypesV2 } from './DrawerStore.v2.types';
import { domainStore } from '@/store/store';

/**
 * Service Locator for confirmation drawer actions.
 * Maps drawer types to their corresponding actions.
 * Actions are zero-argument functions that execute the confirmation logic.
 */
export const ConfirmationActions: Record<string, (id?: string) => void> = {
    [DrawerTypesV2.Confirmation.RemoveDishes]: () => domainStore.interactionsService.interactionsDelete.removeDishes,
    [DrawerTypesV2.Confirmation.RemoveDishItems]: (id?: string) => domainStore.interactionsService.interactionsDelete.removeDishItems(id),
    [DrawerTypesV2.Confirmation.RemoveScheduleFood]: (id?: string) => domainStore.interactionsService.interactionsDelete.removeScheduleFood(id),
    [DrawerTypesV2.Confirmation.RemoveScheduleEvents]: (id?: string) => domainStore.interactionsService.interactionsDelete.removeScheduleEvents(id),

    [DrawerTypesV2.Confirmation.RemoveDailyNorms]: domainStore.interactionsService.interactionsDelete.removeDailyNorms,
    [DrawerTypesV2.Confirmation.RemoveUserFood]: domainStore.interactionsService.interactionsDelete.removeUserFood,
};
