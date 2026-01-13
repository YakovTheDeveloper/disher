
export const hasProduct = (id: number, ids: number[]): boolean => {
    return ids.some((_id) => _id === id)
}

export const getIds = (items: { id: string }[]) => {
    return items.map(({ id }) => id)
}