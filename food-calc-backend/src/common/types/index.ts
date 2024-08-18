type Value = number
export type Id = number

export type NutrientIdToQuantity = Record<Id, Value>

export type IdToQuantity = Record<Id, Value>

export type IdToItem<Item> = Record<Id, Item>

export type UpdateDelta = {
    productsCreated: IdToQuantity;
    productsUpdated: IdToQuantity;
    productsRemoved: IdToItem<boolean>;
}

export type MenuCategory = 'menu' | 'dish'


type IdMap<T> = Record<Id, T>
type IdToNutrientValueMap = IdMap<Value>
export type ProductIdToNutrientsMap = IdMap<IdToNutrientValueMap>