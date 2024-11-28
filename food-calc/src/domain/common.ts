
export const hasProduct = (id: string, ids: string[]): boolean => {
    return ids.some((_id) => +_id === +id)
}