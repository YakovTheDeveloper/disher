import { domainStore } from '@/store/store';
import { GlobalUiStoreInstance } from '@/store/GlobalUiStore/GlobalUiStore';

export const useModalsAndDrawers = (store: GlobalUiStoreInstance = domainStore.globalUiStore) => {
    return {
        drawerStore: store.drawerStore,
        modalStore: store.modalStore,
    };
};