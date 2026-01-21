// import { useLocalObservable } from "mobx-react-lite";
// import { filterBy } from "@/lib/filter/filter";

// export const useFilteringState = <Entity, T extends string>(
//     tabsConfigs: TabConfig<Entity, T>[]
// ) => {
//     const state = useLocalObservable(() => ({

//         currentTab: tabsConfigs[0]?.tabName,
//         filterText: "",

//         setTab(tab: T) {
//             this.currentTab = tab;
//         },
//         setSearch(text: string) {
//             this.filterText = text;
//         },

//         get filteredList(): Entity[] {
//             const config = tabsConfigs.find((c) => c.tabName === this.currentTab);
//             if (!config) return [];
//             return filterBy(config.list, this.filterText, config.filterKeys as string[]);
//         },

//         getFilteredByTab(tabName: T): Entity[] {
//             const config = tabsConfigs.find((c) => c.tabName === tabName);
//             if (!config) return [];
//             return filterBy(config.list, this.filterText, config.filterKeys as string[]);
//         }
//     }));

//     return state;
// };

// export type FilteringState = ReturnType<typeof useFilteringState>
import { useLocalObservable } from "mobx-react-lite";

// 1. Улучшенный интерфейс конфигурации
export interface TabConfig<TabNameType extends string, TEntity> {
    tabName: TabNameType;
    list: readonly TEntity[];
    filterKeys: readonly (keyof TEntity)[];
}

export const useFilteringState = <
    TabNameType extends string,
    TConfigs extends readonly TabConfig<TabNameType, any>[]
>(
    tabsConfigs: TConfigs
) => {
    type TabName = TConfigs[number]["tabName"];

    // Магический тип: создает карту { "продукты": Food, "блюда": Dish }
    type EntityMap = {
        [K in TConfigs[number]as K["tabName"]]: K extends TabConfig<any, infer TEnt> ? TEnt : never
    };

    const state = useLocalObservable(() => ({
        currentTab: tabsConfigs[0].tabName as TabName,
        filterText: "",

        setTab(tab: TabName) {
            this.currentTab = tab;
        },

        setSearch(text: string) {
            this.filterText = text;
        },

        get filteredList(): EntityMap[TabName][] {
            const config = tabsConfigs.find((c) => c.tabName === this.currentTab)!;
            const { list, filterKeys } = config;

            if (!this.filterText) {
                return list as EntityMap[TabName][];
            }

            const lowerSearch = this.filterText.toLowerCase();

            // Здесь мы используем типизацию через generic-параметр конфига
            return (list as any[]).filter((item) => {
                return filterKeys.some((key) => {
                    const value = item[key];
                    return String(value ?? "").toLowerCase().includes(lowerSearch);
                })
            }

            ) as EntityMap[TabName][];
        },
    }));

    return state;
};

export type FilteringState<TabNameType extends string, TConfigs extends readonly TabConfig<TabNameType, any>[]> =
    ReturnType<typeof useFilteringState<TabNameType, TConfigs>>;

export interface IFilteringState<TEntity = any, TTabName = string> {
    currentTab: TTabName;
    filterText: string;
    setTab(tab: TTabName): void;
    setSearch(text: string): void;
    readonly filteredList: TEntity[];
}
