export const nutrientsMap = {
    "1": {
        "id": 1,
        "name": "protein",
        "displayName": "Protein",
        "nameRu": "Белки",
        "unit": "g"
    },
    "2": {
        "id": 2,
        "name": "fats",
        "displayName": "Fats",
        "nameRu": "Жиры",
        "unit": "g"
    },
    "3": {
        "id": 3,
        "name": "carbohydrates",
        "displayName": "Carbohydrates",
        "nameRu": "Углеводы",
        "unit": "g"
    },
    "4": {
        "id": 4,
        "name": "sugar",
        "displayName": "Sugar",
        "nameRu": "Сахар",
        "unit": "g"
    },
    "5": {
        "id": 5,
        "name": "starch",
        "displayName": "Starch",
        "nameRu": "Крахмал",
        "unit": "g"
    },
    "6": {
        "id": 6,
        "name": "fiber",
        "displayName": "Fiber",
        "nameRu": "Клетчатка",
        "unit": "g"
    },
    "7": {
        "id": 7,
        "name": "energy",
        "displayName": "kcal",
        "nameRu": "Энергия",
        "unit": "kcal"
    },
    "8": {
        "id": 8,
        "name": "water",
        "displayName": "Water",
        "nameRu": "Вода",
        "unit": "g"
    },
    "9": {
        "id": 9,
        "name": "iron",
        "displayName": "Iron",
        "nameRu": "Железо",
        "unit": "mg"
    },
    "10": {
        "id": 10,
        "name": "magnesium",
        "displayName": "Magnesium",
        "nameRu": "Магний",
        "unit": "mg"
    },
    "11": {
        "id": 11,
        "name": "phosphorus",
        "displayName": "Phosphorus",
        "nameRu": "Фосфор",
        "unit": "mg"
    },
    "12": {
        "id": 12,
        "name": "potassium",
        "displayName": "Potassium",
        "nameRu": "Калий",
        "unit": "mg"
    },
    "13": {
        "id": 13,
        "name": "sodium",
        "displayName": "Sodium",
        "nameRu": "Натрий",
        "unit": "mg"
    },
    "14": {
        "id": 14,
        "name": "zinc",
        "displayName": "Zinc",
        "nameRu": "Цинк",
        "unit": "mg"
    },
    "15": {
        "id": 15,
        "name": "copper",
        "displayName": "Copper",
        "nameRu": "Медь",
        "unit": "μg"
    },
    "16": {
        "id": 16,
        "name": "manganese",
        "displayName": "Manganese",
        "nameRu": "Марганец",
        "unit": "μg"
    },
    "17": {
        "id": 17,
        "name": "selenium",
        "displayName": "Selenium",
        "nameRu": "Селен",
        "unit": "μg"
    },
    "18": {
        "id": 18,
        "name": "iodine",
        "displayName": "Iodine",
        "nameRu": "Йод",
        "unit": "μg"
    },
    "19": {
        "id": 19,
        "name": "vitaminA",
        "displayName": "Vitamin A",
        "nameRu": "Витамин A",
        "unit": "μg"
    },
    "20": {
        "id": 20,
        "name": "vitaminB1",
        "displayName": "Vitamin B1",
        "nameRu": "Витамин B1",
        "unit": "mg"
    },
    "21": {
        "id": 21,
        "name": "vitaminB2",
        "displayName": "Vitamin B2",
        "nameRu": "Витамин B2",
        "unit": "mg"
    },
    "22": {
        "id": 22,
        "name": "vitaminB3",
        "displayName": "Vitamin B3",
        "nameRu": "Витамин B3",
        "unit": "mg"
    },
    "23": {
        "id": 23,
        "name": "vitaminB4",
        "displayName": "Vitamin B4 (Choline)",
        "nameRu": "Витамин B4 (Холин)",
        "unit": "mg"
    },
    "24": {
        "id": 24,
        "name": "vitaminB5",
        "displayName": "Vitamin B5",
        "nameRu": "Витамин B5",
        "unit": "mg"
    },
    "25": {
        "id": 25,
        "name": "vitaminB6",
        "displayName": "Vitamin B6",
        "nameRu": "Витамин B6",
        "unit": "mg"
    },
    "26": {
        "id": 26,
        "name": "vitaminB9",
        "displayName": "Vitamin B9",
        "nameRu": "Витамин B9",
        "unit": "μg"
    },
    "27": {
        "id": 27,
        "name": "vitaminB12",
        "displayName": "Vitamin B12",
        "nameRu": "Витамин B12",
        "unit": "μg"
    },
    "28": {
        "id": 28,
        "name": "vitaminC",
        "displayName": "Vitamin C",
        "nameRu": "Витамин C",
        "unit": "mg"
    },
    "29": {
        "id": 29,
        "name": "vitaminD",
        "displayName": "Vitamin D",
        "nameRu": "Витамин D",
        "unit": "μg"
    },
    "30": {
        "id": 30,
        "name": "vitaminE",
        "displayName": "Vitamin E",
        "nameRu": "Витамин E",
        "unit": "mg"
    },
    "31": {
        "id": 31,
        "name": "vitaminK",
        "displayName": "Vitamin K",
        "nameRu": "Витамин K",
        "unit": "μg"
    },
    "32": {
        "id": 32,
        "name": "betaCarotene",
        "displayName": "Beta-carotene",
        "nameRu": "Бета-каротин",
        "unit": "μg"
    },
    "33": {
        "id": 33,
        "name": "alphaCarotene",
        "displayName": "Alpha-carotene",
        "nameRu": "Альфа-каротин",
        "unit": "μg"
    }
}

export const nutrientDailyNorms: Record<number, number> = {
    1: 50,       // Protein (g)
    2: 70,       // Fats (g)
    3: 275,      // Carbohydrates (g)
    4: 50,       // Sugar (g)
    5: 130,      // Starch (g)
    6: 25,       // Fiber (g)
    7: 2000,     // Energy (kcal)
    8: 2700,     // Water (g)
    9: 18,       // Iron (mg)
    10: 400,     // Magnesium (mg)
    11: 700,     // Phosphorus (mg)
    12: 3500,    // Potassium (mg)
    13: 2300,    // Sodium (mg)
    14: 11,      // Zinc (mg)
    15: 900,     // Copper (μg)
    16: 2300,    // Manganese (μg)
    17: 55,      // Selenium (μg)
    18: 150,     // Iodine (μg)
    19: 900,     // Vitamin A (μg)
    20: 1.2,     // Vitamin B1 (mg)
    21: 1.3,     // Vitamin B2 (mg)
    22: 16,      // Vitamin B3 (mg)
    23: 425,     // Vitamin B4 (Choline) (mg)
    24: 5,       // Vitamin B5 (mg)
    25: 1.7,     // Vitamin B6 (mg)
    26: 400,     // Vitamin B9 (μg)
    27: 2.4,     // Vitamin B12 (μg)
    28: 90,      // Vitamin C (mg)
    29: 15,      // Vitamin D (μg)
    30: 15,      // Vitamin E (mg)
    31: 120,     // Vitamin K (μg)
    32: 3000,    // Beta-carotene (μg)
    33: 300,     // Alpha-carotene (μg)
};
