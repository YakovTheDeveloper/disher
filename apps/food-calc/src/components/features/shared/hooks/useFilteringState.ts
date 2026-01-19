import { useLocalObservable } from "mobx-react-lite";
import { filterBy } from "@/lib/filter/filter";

export interface TabConfig<Entity, T extends string> {
    tabName: T;
    list: Entity[];
    filterKeys: (keyof Entity)[];
}

export const useFilteringState = <Entity, T extends string>(
    tabsConfigs: TabConfig<Entity, T>[]
) => {
    const state = useLocalObservable(() => ({

        currentTab: tabsConfigs[0]?.tabName,
        filterText: "",

        setTab(tab: T) {
            this.currentTab = tab;
        },
        setSearch(text: string) {
            this.filterText = text;
        },

        get filteredList(): Entity[] {
            const config = tabsConfigs.find((c) => c.tabName === this.currentTab);
            if (!config) return [];
            return filterBy(config.list, this.filterText, config.filterKeys as string[]);
        },

        getFilteredByTab(tabName: T): Entity[] {
            const config = tabsConfigs.find((c) => c.tabName === tabName);
            if (!config) return [];
            return filterBy(config.list, this.filterText, config.filterKeys as string[]);
        }
    }));

    return state;
};

export type FilteringState = ReturnType<typeof useFilteringState>