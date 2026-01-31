import { DrawerTypesV2 } from './DrawerStore.v2.types';
import { domainStore } from '@/store/store';

/**
 * Service Locator for confirmation drawer actions.
 * Maps drawer types to their corresponding actions.
 * Actions are zero-argument functions that execute the confirmation logic.
 */
export const ConfirmationActions: Record<string, (id?: string) => void> = {
    [DrawerTypesV2.Confirmation.RemoveDishes]: domainStore.interactionsService.interactionsDelete.removeDishes,
    [DrawerTypesV2.Confirmation.RemoveDishItems]: domainStore.interactionsService.interactionsDelete.removeDishItems,
    [DrawerTypesV2.Confirmation.RemoveScheduleFood]: domainStore.interactionsService.interactionsDelete.removeScheduleFood,
    [DrawerTypesV2.Confirmation.RemoveScheduleEvents]: domainStore.interactionsService.interactionsDelete.removeScheduleEvents,

    [DrawerTypesV2.Confirmation.RemoveDailyNorms]: domainStore.interactionsService.interactionsDelete.removeDailyNorms,
    [DrawerTypesV2.Confirmation.RemoveUserFood]: domainStore.interactionsService.interactionsDelete.removeUserFood,
};
