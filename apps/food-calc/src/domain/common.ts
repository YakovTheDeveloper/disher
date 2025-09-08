
export const hasProduct = (id: number, ids: number[]): boolean => {
    return ids.some((_id) => _id === id)
}