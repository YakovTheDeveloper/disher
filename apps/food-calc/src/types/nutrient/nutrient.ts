export type INutrient = {
    id: number,
    name: string
    group: string
}

export type NutrientName = 'protein'
    | 'fats'
    | 'carbohydrates'
    | 'sugar'
    | 'starch'
    | 'fiber'
    | 'energy'
    | 'water'
    | 'iron'
    | 'magnesium'
    | 'phosphorus'
    | 'calcium'
    | 'potassium'
    | 'sodium'
    | 'zinc'
    | 'copper'
    | 'manganese'
    | 'selenium'
    | 'iodine'
    | 'vitaminA'
    | 'vitaminB1'
    | 'vitaminB2'
    | 'vitaminB3'
    | 'vitaminB4'
    | 'vitaminB5'
    | 'vitaminB6'
    | 'vitaminB7'
    | 'vitaminB9'
    | 'vitaminB12'
    | 'vitaminC'
    | 'vitaminD'
    | 'vitaminE'
    | 'vitaminK'
    | 'betaCarotene'
    | 'alphaCarotene'

export type NutrientData = { id: number, name: NutrientName, displayName: string, displayNameRu: string, unit: NutrientUnit, "unitRu": NutrientUnitRu }

export type NutrientUnit = 'g' | 'μg' | 'mg' | 'kcal'
export type NutrientUnitRu = 'г' | 'мг' | 'мкг' | 'ккал'

export type NutrientGroupName = 'main' | 'vitaminsB' | 'minerals' | 'rest'

export type NutrientGroup = {
    name: NutrientGroupName
    displayName: string
    content: NutrientData[]
}