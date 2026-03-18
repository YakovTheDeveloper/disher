const filterKeys = ['name'] as const;

// TODO: migrate to Triplit hooks — lists should come from useQuery
export const foodSearchConfing = [
    {
        tabName: 'продукты',
        list: [] as any[],
        filterKeys,
    },
    {
        tabName: 'блюда',
        list: [] as any[],
        filterKeys,
    },
] as const;

export const createSearchFoodConfig = (): typeof foodSearchConfing => {
    return [...foodSearchConfing]
}
