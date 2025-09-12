type FoodDTO = {
    id: number
    name: string
}

export type FoodQuantityDTO = {
    food: FoodDTO
    quantity: number
}

type FoodQuantityDTOInput = {
    food: FoodDTO | null
    quantity: number
}

export function createFoodQuantityCollectionDTO(
    init: FoodQuantityDTOInput[]
): FoodQuantityDTO[] {
    return init
        .filter(el => el.food !== null)
        .map(el => ({ food: { id: el.food!.id, name: el.food!.name }, quantity: el.quantity }));
}
