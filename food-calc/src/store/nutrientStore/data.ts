import { NutrientData, NutrientName, NutrientUnit, NutrientUnitRu } from "@/types/nutrient/nutrient";

export type NutrientCategory = {
    id: number;
    name: string;
    displayName: string;
    displayNameRu: string;
    unit: NutrientUnit;
    unitRu: NutrientUnitRu;
}

export const defaultNutrients: NutrientData[] = [
    { id: 1, name: 'protein', displayName: 'Protein', displayNameRu: 'Белки', unit: 'g', "unitRu": "г" },
    { id: 2, name: 'fats', displayName: 'Fats', displayNameRu: 'Жиры', unit: 'g', "unitRu": "г" },
    { id: 3, name: 'carbohydrates', displayName: 'Carbohydrates', displayNameRu: 'Углеводы', unit: 'g', "unitRu": "г" },
    { id: 4, name: 'sugar', displayName: 'Sugar', displayNameRu: 'Сахар', unit: 'g', "unitRu": "г" },
    { id: 5, name: 'starch', displayName: 'Starch', displayNameRu: 'Крахмал', unit: 'g', "unitRu": "г" },
    { id: 6, name: 'fiber', displayName: 'Fiber', displayNameRu: 'Клетчатка', unit: 'g', "unitRu": "г" },
    { id: 7, name: 'energy', displayName: 'kcal', displayNameRu: 'Энергия', unit: 'kcal', "unitRu": "ккал" },
    { id: 8, name: 'water', displayName: 'Water', displayNameRu: 'Вода', unit: 'g', "unitRu": "г" },

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

    { id: 20, name: 'vitaminA', displayName: 'Vitamin A', displayNameRu: 'Витамин A', unit: 'μg', "unitRu": "мкг" },
    { id: 21, name: 'vitaminB1', displayName: 'Vitamin B1', displayNameRu: 'Витамин B1', unit: 'mg', "unitRu": "мг" },
    { id: 22, name: 'vitaminB2', displayName: 'Vitamin B2', displayNameRu: 'Витамин B2', unit: 'mg', "unitRu": "мг" },
    { id: 23, name: 'vitaminB3', displayName: 'Vitamin B3', displayNameRu: 'Витамин B3', unit: 'mg', "unitRu": "мг" },
    { id: 24, name: 'vitaminB4', displayName: 'Vitamin B4 (Choline)', displayNameRu: 'Витамин B4', unit: 'mg', "unitRu": "мг" },
    { id: 25, name: 'vitaminB5', displayName: 'Vitamin B5', displayNameRu: 'Витамин B5', unit: 'mg', "unitRu": "мг" },
    { id: 26, name: 'vitaminB6', displayName: 'Vitamin B6', displayNameRu: 'Витамин B6', unit: 'mg', "unitRu": "мг" },
    { id: 27, name: 'vitaminB7', displayName: 'Biotin', displayNameRu: 'Биотин', unit: 'mg', "unitRu": "мг" },
    { id: 28, name: 'vitaminB9', displayName: 'Vitamin B9', displayNameRu: 'Витамин B9', unit: 'μg', "unitRu": "мкг" },
    { id: 29, name: 'vitaminB12', displayName: 'Vitamin B12', displayNameRu: 'Витамин B12', unit: 'μg', "unitRu": "мкг" },
    { id: 30, name: 'vitaminC', displayName: 'Vitamin C', displayNameRu: 'Витамин C', unit: 'mg', "unitRu": "мг" },
    { id: 31, name: 'vitaminD', displayName: 'Vitamin D', displayNameRu: 'Витамин D', unit: 'μg', "unitRu": "мкг" },
    { id: 32, name: 'vitaminE', displayName: 'Vitamin E', displayNameRu: 'Витамин E', unit: 'mg', "unitRu": "мг" },
    { id: 33, name: 'vitaminK', displayName: 'Vitamin K', displayNameRu: 'Витамин K', unit: 'μg', "unitRu": "мкг" },
    { id: 34, name: 'betaCarotene', displayName: 'Beta-carotene', displayNameRu: 'Бета-каротин', unit: 'μg', "unitRu": "мкг" },
    { id: 35, name: 'alphaCarotene', displayName: 'Alpha-carotene', displayNameRu: 'Альфа-каротин', unit: 'μg', "unitRu": "мкг" }
];


export const nutrientsMap: Record<number, NutrientCategory> = defaultNutrients
    .reduce((acc, nutrient) => acc[nutrient.id] = nutrient, {} as Record<number, NutrientData>)


// export const nutrientsMap: Record<number, NutrientCategory> = {
//     "1": {
//         "id": 1,
//         "name": "protein",
//         "displayName": "Protein",
//         "displayNameRu": "Белки",
//         "unit": "g",
//         "unitRu": "г"
//     },
//     "2": {
//         "id": 2,
//         "name": "fats",
//         "displayName": "Fats",
//         "displayNameRu": "Жиры",
//         "unit": "g",
//         "unitRu": "г"
//     },
//     "3": {
//         "id": 3,
//         "name": "carbohydrates",
//         "displayName": "Carbohydrates",
//         "displayNameRu": "Углеводы",
//         "unit": "g",
//         "unitRu": "г"
//     },
//     "4": {
//         "id": 4,
//         "name": "sugar",
//         "displayName": "Sugar",
//         "displayNameRu": "Сахар",
//         "unit": "g",
//         "unitRu": "г"
//     },
//     "5": {
//         "id": 5,
//         "name": "starch",
//         "displayName": "Starch",
//         "displayNameRu": "Крахмал",
//         "unit": "g",
//         "unitRu": "г"
//     },
//     "6": {
//         "id": 6,
//         "name": "fiber",
//         "displayName": "Fiber",
//         "displayNameRu": "Клетчатка",
//         "unit": "g",
//         "unitRu": "г"
//     },
//     "7": {
//         "id": 7,
//         "name": "energy",
//         "displayName": "kcal",
//         "displayNameRu": "Энергия",
//         "unit": "kcal",
//         "unitRu": "ккал"
//     },
//     "8": {
//         "id": 8,
//         "name": "water",
//         "displayName": "Water",
//         "displayNameRu": "Вода",
//         "unit": "g",
//         "unitRu": "г"
//     },
//     "9": {
//         "id": 9,
//         "name": "iron",
//         "displayName": "Iron",
//         "displayNameRu": "Железо",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "10": {
//         "id": 10,
//         "name": "magnesium",
//         "displayName": "Magnesium",
//         "displayNameRu": "Магний",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "11": {
//         "id": 11,
//         "name": "phosphorus",
//         "displayName": "Phosphorus",
//         "displayNameRu": "Фосфор",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "12": {
//         "id": 12,
//         "name": "potassium",
//         "displayName": "Potassium",
//         "displayNameRu": "Калий",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "13": {
//         "id": 13,
//         "name": "sodium",
//         "displayName": "Sodium",
//         "displayNameRu": "Натрий",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "14": {
//         "id": 14,
//         "name": "zinc",
//         "displayName": "Zinc",
//         "displayNameRu": "Цинк",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "15": {
//         "id": 15,
//         "name": "copper",
//         "displayName": "Copper",
//         "displayNameRu": "Медь",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "16": {
//         "id": 16,
//         "name": "manganese",
//         "displayName": "Manganese",
//         "displayNameRu": "Марганец",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "17": {
//         "id": 17,
//         "name": "selenium",
//         "displayName": "Selenium",
//         "displayNameRu": "Селен",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "18": {
//         "id": 18,
//         "name": "iodine",
//         "displayName": "Iodine",
//         "displayNameRu": "Йод",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "19": {
//         "id": 19,
//         "name": "vitaminA",
//         "displayName": "Vitamin A",
//         "displayNameRu": "Витамин A",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "20": {
//         "id": 20,
//         "name": "vitaminB1",
//         "displayName": "Vitamin B1",
//         "displayNameRu": "Витамин B1",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "21": {
//         "id": 21,
//         "name": "vitaminB2",
//         "displayName": "Vitamin B2",
//         "displayNameRu": "Витамин B2",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "22": {
//         "id": 22,
//         "name": "vitaminB3",
//         "displayName": "Vitamin B3",
//         "displayNameRu": "Витамин B3",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "23": {
//         "id": 23,
//         "name": "vitaminB4",
//         "displayName": "Vitamin B4 (Choline)",
//         "displayNameRu": "Витамин B4",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "24": {
//         "id": 24,
//         "name": "vitaminB5",
//         "displayName": "Vitamin B5",
//         "displayNameRu": "Витамин B5",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "25": {
//         "id": 25,
//         "name": "vitaminB6",
//         "displayName": "Vitamin B6",
//         "displayNameRu": "Витамин B6",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "26": {
//         "id": 26,
//         "name": "vitaminB9",
//         "displayName": "Vitamin B9",
//         "displayNameRu": "Витамин B9",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "27": {
//         "id": 27,
//         "name": "vitaminB12",
//         "displayName": "Vitamin B12",
//         "displayNameRu": "Витамин B12",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "28": {
//         "id": 28,
//         "name": "vitaminC",
//         "displayName": "Vitamin C",
//         "displayNameRu": "Витамин C",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "29": {
//         "id": 29,
//         "name": "vitaminD",
//         "displayName": "Vitamin D",
//         "displayNameRu": "Витамин D",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "30": {
//         "id": 31,
//         "name": "vitaminK",
//         "displayName": "Vitamin K",
//         "displayNameRu": "Витамин K",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "31": {
//         "id": 30,
//         "name": "vitaminE",
//         "displayName": "Vitamin E",
//         "displayNameRu": "Витамин E",
//         "unit": "mg",
//         "unitRu": "мг"
//     },
//     "32": {
//         "id": 32,
//         "name": "betaCarotene",
//         "displayName": "Beta-carotene",
//         "displayNameRu": "Бета-каротин",
//         "unit": "μg",
//         "unitRu": "мкг"
//     },
//     "33": {
//         "id": 33,
//         "name": "alphaCarotene",
//         "displayName": "Alpha-carotene",
//         "displayNameRu": "Альфа-каротин",
//         "unit": "μg",
//         "unitRu": "мкг"
//     }
// }

export const nutrientsPadding: Record<number, boolean> = {
    1: false,       // Protein (g)
    2: false,       // Fats (g)
    3: false,      // Carbohydrates (g)
    4: true,       // Sugar (g)
    5: true,      // Starch (g)
    6: true,       // Fiber (g)
    7: false,     // Energy (kcal)
    8: false,     // Water (g)
    9: false,       // Iron (mg)
    10: false,     // Magnesium (mg)
    11: false,     // Phosphorus (mg)
    12: false,    // Potassium (mg)
    13: false,    // Sodium (mg)
    14: false,      // Zinc (mg)
    15: false,     // Copper (μg)
    16: false,    // Manganese (μg)
    17: false,      // Selenium (μg)
    18: false,     // Iodine (μg)
    19: false,     // Vitamin A (μg)
    20: false,     // Vitamin B1 (mg)
    21: false,     // Vitamin B2 (mg)
    22: false,      // Vitamin B3 (mg)
    23: false,     // Vitamin B4 (Choline) (mg)
    24: false,       // Vitamin B5 (mg)
    25: false,     // Vitamin B6 (mg)
    26: false,     // Vitamin B9 (μg)
    27: false,     // Vitamin B12 (μg)
    28: false,      // Vitamin C (mg)
    29: false,      // Vitamin D (μg)
    30: false,      // Vitamin E (mg)
    31: false,     // Vitamin K (μg)
    32: false,    // Beta-carotene (μg)
    33: false,     // Alpha-carotene (μg)
    34: false,     // Beta-carotene (μg)
    35: false,     // Alpha-carotene (μg)
}

export const nutrientsHaveDailyNorm: Record<NutrientName, boolean> = {
    "protein": true,
    "fats": true,
    "carbohydrates": true,
    "fiber": true,
    "energy": true,
    "water": true,
    "iron": true,
    "calcium": true,
    "sugar": false,
    "starch": false,
    "magnesium": true,
    "phosphorus": true,
    "potassium": true,
    "sodium": true,
    "zinc": true,
    "copper": true,
    "manganese": true,
    "selenium": true,
    "iodine": true,
    "vitaminA": true,
    "vitaminB1": true,
    "vitaminB2": true,
    "vitaminB3": true,
    "vitaminB4": true,
    "vitaminB5": true,
    "vitaminB6": true,
    "vitaminB7": false,
    "vitaminB9": true,
    "vitaminB12": true,
    "vitaminC": true,
    "vitaminD": true,
    "vitaminE": true,
    "vitaminK": true,
    "betaCarotene": false,
    "alphaCarotene": false,
}

// export const nutrientDailyNorms: Record<number, number> = {
//     1: 50,       // Protein (g)
//     2: 70,       // Fats (g)
//     3: 275,      // Carbohydrates (g)
//     4: 50,       // Sugar (g)
//     5: 130,      // Starch (g)
//     6: 25,       // Fiber (g)
//     7: 2000,     // Energy (kcal)
//     8: 2700,     // Water (g)
//     9: 18,       // Iron (mg)
//     10: 400,     // Magnesium (mg)
//     11: 700,     // Phosphorus (mg)
//     12: 3500,    // Potassium (mg)
//     13: 2300,    // Sodium (mg)
//     14: 11,      // Zinc (mg)
//     15: 900,     // Copper (μg)
//     16: 2300,    // Manganese (μg)
//     17: 55,      // Selenium (μg)
//     18: 150,     // Iodine (μg)
//     19: 900,     // Vitamin A (μg)
//     20: 1.2,     // Vitamin B1 (mg)
//     21: 1.3,     // Vitamin B2 (mg)
//     22: 16,      // Vitamin B3 (mg)
//     23: 425,     // Vitamin B4 (Choline) (mg)
//     24: 5,       // Vitamin B5 (mg)
//     25: 1.7,     // Vitamin B6 (mg)
//     26: 400,     // Vitamin B9 (μg)
//     27: 2.4,     // Vitamin B12 (μg)
//     28: 90,      // Vitamin C (mg)
//     29: 15,      // Vitamin D (μg)
//     30: 15,      // Vitamin E (mg)
//     31: 120,     // Vitamin K (μg)
//     32: 3000,    // Beta-carotene (μg)
//     33: 300,     // Alpha-carotene (μg)
// };
