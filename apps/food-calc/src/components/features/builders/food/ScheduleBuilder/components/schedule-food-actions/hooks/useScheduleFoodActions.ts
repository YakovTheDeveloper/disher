import { useLocalObservable } from "mobx-react-lite";
import { ScheduleItem } from '@/domain/schedule/schedule';
import { Instance } from "mobx-state-tree";
import { filterBy } from "@/lib/filter/filter";
import { domainStore } from "@/store/store";

type SearchTabs = 'productSearch' | 'dishSearch' | 'createCustom';

export const useScheduleFoodActions = (currentChild: Instance<typeof ScheduleItem>) => {

    const searchState = useLocalObservable(() => ({
        currentTab: 'productSearch' as SearchTabs,
        filterText: '',
        customProductText: currentChild?.content?.customName || '',

        setTab(tab: SearchTabs) {
            this.currentTab = tab;
        },

        setSearch(text: string) {
            this.filterText = text;
        },

        setCustomText(text: string) {
            this.customProductText = text;
        },

        foodSearchState: {
            get filterSearchText() {
                return searchState.filterText;
            },
            get localFiltered() {
                return filterBy(domainStore.foodStore.list, this.filterSearchText, ['name', 'title']);
            },
        },

        dishSearchState: {
            get filterSearchText() {
                return searchState.filterText;
            },
            get localFiltered() {
                return filterBy(domainStore.dishStore.list, this.filterSearchText, ['name', 'title']);
            },
        },
    }));

    return {
        searchState
    }
}