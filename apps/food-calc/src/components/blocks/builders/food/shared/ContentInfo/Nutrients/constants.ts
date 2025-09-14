import { NutrientGroup, NutrientName } from "@/types/nutrient/nutrient";

export const nutrientNames: Record<number, string> = {
    1: 'Белки',
    2: 'Жиры',
    3: 'Углеводы',
    4: 'Сахар',
    5: 'Крахмал',
    6: 'Клетчатка',
    7: 'Энергия',
    8: 'Вода',
    9: 'Железо',
    10: 'Магний',
    11: 'Фосфор',
    12: 'Кальций',
    13: 'Калий',
    14: 'Натрий',
    15: 'Цинк',
    16: 'Медь',
    17: 'Марганец',
    18: 'Селен',
    19: 'Йод',
    20: 'Витамин A',
    21: 'Витамин B1',
    22: 'Витамин B2',
    23: 'Витамин B3',
    24: 'Витамин B4 (Холин)',
    25: 'Витамин B5',
    26: 'Витамин B6',
    27: 'Биотин',
    28: 'Витамин B9',
    29: 'Витамин B12',
    30: 'Витамин C',
    31: 'Витамин D',
    32: 'Витамин E',
    33: 'Витамин K',
    34: 'Бета-каротин',
    35: 'Альфа-каротин',
};

export const nutrientGroups: NutrientGroup[] = [
    {
        name: 'main',
        displayName: 'Основные',
        content: [
            { id: 1, name: 'protein', displayName: 'Protein', displayNameRu: 'Белки', unit: 'g', "unitRu": "г" },
            { id: 2, name: 'fats', displayName: 'Fats', displayNameRu: 'Жиры', unit: 'g', "unitRu": "г" },
            { id: 3, name: 'carbohydrates', displayName: 'Carbohydrates', displayNameRu: 'Углеводы', unit: 'g', "unitRu": "г" },
            { id: 4, name: 'sugar', displayName: 'Sugar', displayNameRu: 'Сахар', unit: 'g', "unitRu": "г" },
            { id: 5, name: 'starch', displayName: 'Starch', displayNameRu: 'Крахмал', unit: 'g', "unitRu": "г" },
            { id: 6, name: 'fiber', displayName: 'Fiber', displayNameRu: 'Клетчатка', unit: 'g', "unitRu": "г" },
            { id: 7, name: 'energy', displayName: 'kcal', displayNameRu: 'Энергия', unit: 'kcal', "unitRu": "ккал" },
            { id: 8, name: 'water', displayName: 'Water', displayNameRu: 'Вода', unit: 'g', "unitRu": "г" },
        ]
    },
    {
        name: 'vitaminsB',
        displayName: 'Витамины группы Б',
        content: [
            { id: 21, name: 'vitaminB1', displayName: 'Vitamin B1', displayNameRu: 'Витамин B1', unit: 'mg', "unitRu": "мг" },
            { id: 22, name: 'vitaminB2', displayName: 'Vitamin B2', displayNameRu: 'Витамин B2', unit: 'mg', "unitRu": "мг" },
            { id: 23, name: 'vitaminB3', displayName: 'Vitamin B3', displayNameRu: 'Витамин B3', unit: 'mg', "unitRu": "мг" },
            { id: 24, name: 'vitaminB4', displayName: 'Vitamin B4 (Choline)', displayNameRu: 'Витамин B4', unit: 'mg', "unitRu": "мг" },
            { id: 25, name: 'vitaminB5', displayName: 'Vitamin B5', displayNameRu: 'Витамин B5', unit: 'mg', "unitRu": "мг" },
            { id: 26, name: 'vitaminB6', displayName: 'Vitamin B6', displayNameRu: 'Витамин B6', unit: 'mg', "unitRu": "мг" },
            { id: 27, name: 'vitaminB7', displayName: 'Biotin', displayNameRu: 'Биотин', unit: 'mg', "unitRu": "мг" },
            { id: 28, name: 'vitaminB9', displayName: 'Vitamin B9', displayNameRu: 'Витамин B9', unit: 'μg', "unitRu": "мкг" },
            { id: 29, name: 'vitaminB12', displayName: 'Vitamin B12', displayNameRu: 'Витамин B12', unit: 'μg', "unitRu": "мкг" },
        ]
    },
    {
        name: 'minerals',
        displayName: 'Минералы',
        content: [
            { id: 9, name: 'iron', displayName: 'Iron', displayNameRu: 'Железо', unit: 'mg', "unitRu": "мг" },
            { id: 10, name: 'magnesium', displayName: 'Magnesium', displayNameRu: 'Магний', unit: 'mg', "unitRu": "мг" },
            { id: 11, name: 'phosphorus', displayName: 'Phosphorus', displayNameRu: 'Фосфор', unit: 'mg', "unitRu": "мг" },
            { id: 12, name: 'calcium', displayName: 'Calcium', displayNameRu: 'Кальций', unit: 'mg', "unitRu": "мг" },
            { id: 13, name: 'potassium', displayName: 'Potassium', displayNameRu: 'Калий', unit: 'mg', "unitRu": "мг" },
            { id: 14, name: 'sodium', displayName: 'Sodium', displayNameRu: 'Натрий', unit: 'mg', "unitRu": "мг" },
            { id: 15, name: 'zinc', displayName: 'Zinc', displayNameRu: 'Цинк', unit: 'mg', "unitRu": "мг" },
            { id: 16, name: 'copper', displayName: 'Copper', displayNameRu: 'Медь', unit: 'μg', "unitRu": "мкг" },
            { id: 17, name: 'manganese', displayName: 'Manganese', displayNameRu: 'Марганец', unit: 'μg', "unitRu": "мкг" },
            { id: 18, name: 'selenium', displayName: 'Selenium', displayNameRu: 'Селен', unit: 'μg', "unitRu": "мкг" },
            { id: 19, name: 'iodine', displayName: 'Iodine', displayNameRu: 'Йод', unit: 'μg', "unitRu": "мкг" },
        ]
    },
    {
        name: 'rest',
        displayName: 'Остальные витамины и прочее',
        content: [
            { id: 20, name: 'vitaminA', displayName: 'Vitamin A', displayNameRu: 'Витамин A', unit: 'μg', "unitRu": "мкг" },

            { id: 30, name: 'vitaminC', displayName: 'Vitamin C', displayNameRu: 'Витамин C', unit: 'mg', "unitRu": "мг" },
            { id: 31, name: 'vitaminD', displayName: 'Vitamin D', displayNameRu: 'Витамин D', unit: 'μg', "unitRu": "мкг" },
            { id: 32, name: 'vitaminE', displayName: 'Vitamin E', displayNameRu: 'Витамин E', unit: 'mg', "unitRu": "мг" },
            { id: 33, name: 'vitaminK', displayName: 'Vitamin K', displayNameRu: 'Витамин K', unit: 'μg', "unitRu": "мкг" },
            { id: 34, name: 'betaCarotene', displayName: 'Beta-carotene', displayNameRu: 'β-каротин', unit: 'μg', "unitRu": "мкг" },
            { id: 35, name: 'alphaCarotene', displayName: 'Alpha-carotene', displayNameRu: 'α-каротин', unit: 'μg', "unitRu": "мкг" }
        ]
    },
]
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