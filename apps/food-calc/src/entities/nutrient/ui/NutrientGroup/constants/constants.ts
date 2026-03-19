export type Nutrient = {
    id: string;
    name: string;
    displayName: string;
    displayNameRu: string;
    unit: string;
    unitRu: string;
    symbol: string
    group: string
};

export type NutrientGroup = {
    name: string;
    displayName: string;
    content: Nutrient[];
};

export const nutrientGroups: NutrientGroup[] = [
    {
        name: 'main',
        displayName: 'Основные',
        content: [
            { id: '1', name: 'protein', symbol: 'PRO', displayName: 'Protein', displayNameRu: 'Белки', unit: 'g', unitRu: 'г', group: 'main' },
            { id: '2', name: 'fats', symbol: 'FAT', displayName: 'Fats', displayNameRu: 'Жиры', unit: 'g', unitRu: 'г', group: 'main' },
            { id: '3', name: 'carbohydrates', symbol: 'CARB', displayName: 'Carbohydrates', displayNameRu: 'Углеводы', unit: 'g', unitRu: 'г', group: 'main' },
            { id: '4', name: 'sugar', symbol: 'SUG', displayName: 'Sugar', displayNameRu: 'Сахар', unit: 'g', unitRu: 'г', group: 'main' },
            { id: '5', name: 'starch', symbol: 'STA', displayName: 'Starch', displayNameRu: 'Крахмал', unit: 'g', unitRu: 'г', group: 'main' },
            { id: '6', name: 'fiber', symbol: 'FIB', displayName: 'Fiber', displayNameRu: 'Клетчатка', unit: 'g', unitRu: 'г', group: 'main' },
            { id: '7', name: 'energy', symbol: 'kcal', displayName: 'kcal', displayNameRu: 'Энергия', unit: 'kcal', unitRu: 'ккал', group: 'main' },
            { id: '8', name: 'water', symbol: 'H₂O', displayName: 'Water', displayNameRu: 'Вода', unit: 'g', unitRu: 'г', group: 'main' },
        ]
    },
    {
        name: 'vitaminsB',
        displayName: 'Витамины Б',
        content: [
            { id: '21', name: 'vitaminB1', symbol: 'B1', displayName: 'Thiamine', displayNameRu: 'Тиамин', unit: 'mg', unitRu: 'мг', group: 'vitaminsB' },
            { id: '22', name: 'vitaminB2', symbol: 'B2', displayName: 'Riboflavin', displayNameRu: 'Рибофлавин', unit: 'mg', unitRu: 'мг', group: 'vitaminsB' },
            { id: '23', name: 'vitaminB3', symbol: 'B3', displayName: 'Niacin', displayNameRu: 'Ниацин', unit: 'mg', unitRu: 'мг', group: 'vitaminsB' },
            { id: '24', name: 'vitaminB4', symbol: 'B4', displayName: 'Choline', displayNameRu: 'Холин', unit: 'mg', unitRu: 'мг', group: 'vitaminsB' },
            { id: '25', name: 'vitaminB5', symbol: 'B5', displayName: 'Pantothenic acid', displayNameRu: 'Пантотеновая кислота', unit: 'mg', unitRu: 'мг', group: 'vitaminsB' },
            { id: '26', name: 'vitaminB6', symbol: 'B6', displayName: 'Pyridoxine', displayNameRu: 'Пиридоксин', unit: 'mg', unitRu: 'мг', group: 'vitaminsB' },
            { id: '27', name: 'vitaminB7', symbol: 'B7', displayName: 'Biotin', displayNameRu: 'Биотин', unit: 'mg', unitRu: 'мг', group: 'vitaminsB' },
            { id: '28', name: 'vitaminB9', symbol: 'B9', displayName: 'Folate', displayNameRu: 'Фолиевая кислота', unit: 'μg', unitRu: 'мкг', group: 'vitaminsB' },
            { id: '29', name: 'vitaminB12', symbol: 'B12', displayName: 'Cobalamin', displayNameRu: 'Кобаламин', unit: 'μg', unitRu: 'мкг', group: 'vitaminsB' },
        ]
    },
    {
        name: 'minerals',
        displayName: 'Минералы',
        content: [
            { id: '9', name: 'iron', symbol: 'Fe', displayName: 'Iron', displayNameRu: 'Железо', unit: 'mg', unitRu: 'мг', group: 'minerals' },
            { id: '10', name: 'magnesium', symbol: 'Mg', displayName: 'Magnesium', displayNameRu: 'Магний', unit: 'mg', unitRu: 'мг', group: 'minerals' },
            { id: '11', name: 'phosphorus', symbol: 'P', displayName: 'Phosphorus', displayNameRu: 'Фосфор', unit: 'mg', unitRu: 'мг', group: 'minerals' },
            { id: '12', name: 'calcium', symbol: 'Ca', displayName: 'Calcium', displayNameRu: 'Кальций', unit: 'mg', unitRu: 'мг', group: 'minerals' },
            { id: '13', name: 'potassium', symbol: 'K', displayName: 'Potassium', displayNameRu: 'Калий', unit: 'mg', unitRu: 'мг', group: 'minerals' },
            { id: '14', name: 'sodium', symbol: 'Na', displayName: 'Sodium', displayNameRu: 'Натрий', unit: 'mg', unitRu: 'мг', group: 'minerals' },
            { id: '15', name: 'zinc', symbol: 'Zn', displayName: 'Zinc', displayNameRu: 'Цинк', unit: 'mg', unitRu: 'мг', group: 'minerals' },
            { id: '16', name: 'copper', symbol: 'Cu', displayName: 'Copper', displayNameRu: 'Медь', unit: 'μg', unitRu: 'мкг', group: 'minerals' },
            { id: '17', name: 'manganese', symbol: 'Mn', displayName: 'Manganese', displayNameRu: 'Марганец', unit: 'μg', unitRu: 'мкг', group: 'minerals' },
            { id: '18', name: 'selenium', symbol: 'Se', displayName: 'Selenium', displayNameRu: 'Селен', unit: 'μg', unitRu: 'мкг', group: 'minerals' },
            { id: '19', name: 'iodine', symbol: 'I', displayName: 'Iodine', displayNameRu: 'Йод', unit: 'μg', unitRu: 'мкг', group: 'minerals' },
        ]
    },
    {
        name: 'rest',
        displayName: 'Остальные витамины',
        content: [
            { id: '20', name: 'vitaminA', symbol: 'A', displayName: 'Vitamin A', displayNameRu: 'Витамин A', unit: 'μg', unitRu: 'мкг', group: 'rest' },
            { id: '30', name: 'vitaminC', symbol: 'C', displayName: 'Vitamin C', displayNameRu: 'Витамин C', unit: 'mg', unitRu: 'мг', group: 'rest' },
            { id: '31', name: 'vitaminD', symbol: 'D', displayName: 'Vitamin D', displayNameRu: 'Витамин D', unit: 'μg', unitRu: 'мкг', group: 'rest' },
            { id: '32', name: 'vitaminE', symbol: 'E', displayName: 'Vitamin E', displayNameRu: 'Витамин E', unit: 'mg', unitRu: 'мг', group: 'rest' },
            { id: '33', name: 'vitaminK', symbol: 'K', displayName: 'Vitamin K', displayNameRu: 'Витамин K', unit: 'μg', unitRu: 'мкг', group: 'rest' },
            { id: '34', name: 'betaCarotene', symbol: 'βC', displayName: 'Beta-carotene', displayNameRu: 'β-каротин', unit: 'μg', unitRu: 'мкг', group: 'rest' },
            { id: '35', name: 'alphaCarotene', symbol: 'αC', displayName: 'Alpha-carotene', displayNameRu: 'α-каротин', unit: 'μg', unitRu: 'мкг', group: 'rest' }
        ]
    }
]

export const allNutrientsList = nutrientGroups.flatMap((item) => {
    return item.content.map(content => content)
})

export const nutrientsHaveDailyNorm: Record<number, boolean> = {
    1: true,   // protein
    2: true,   // fats
    3: true,   // carbohydrates
    4: false,  // sugar
    5: false,  // starch
    6: true,   // fiber
    7: true,   // energy
    8: true,   // water
    9: true,   // iron
    10: true,  // magnesium
    11: true,  // phosphorus
    12: true,  // calcium
    13: true,  // potassium
    14: true,  // sodium
    15: true,  // zinc
    16: true,  // copper
    17: true,  // manganese
    18: true,  // selenium
    19: true,  // iodine
    20: true,  // vitaminA
    21: true,  // vitaminB1
    22: true,  // vitaminB2
    23: true,  // vitaminB3
    24: true,  // vitaminB4
    25: true,  // vitaminB5
    26: true,  // vitaminB6
    27: false, // vitaminB7
    28: true,  // vitaminB9
    29: true,  // vitaminB12
    30: true,  // vitaminC
    31: true,  // vitaminD
    32: true,  // vitaminE
    33: true,  // vitaminK
    34: false, // betaCarotene
    35: false, // alphaCarotene
}

export const defaultDailyNorms: Record<number, number> = {
    1: 51,
    2: 70,
    3: 275,
    4: 50,
    5: 30,
    6: 25,
    7: 2000,
    8: 2000,
    9: 18,
    10: 1000,
    11: 350,
    12: 700,
    13: 3500,
    14: 2300,
    15: 15,
    16: 900,
    17: 2300,
    18: 55,
    19: 150,
    20: 900,
    21: 1.2,
    22: 1.3,
    23: 16,
    24: 550,
    25: 5,
    26: 2,
    28: 400,
    29: 2.4,
    30: 90,
    31: 20,
    32: 15,
    33: 120,
    34: 3000,
    35: 600,
};