import { domainStore } from '@/store/store';

const filterKeys = ['name'] as const;

export const foodSearchConfing = [
    {
        tabName: 'продукты',
        list: domainStore.foodStore.merged,
        filterKeys,
    },
    {
        tabName: 'блюда',
        list: domainStore.dishStore.merged,
        filterKeys,
    },
] as const;

export const createSearchFoodConfig = (): typeof foodSearchConfing => {
    return [...foodSearchConfing]
}