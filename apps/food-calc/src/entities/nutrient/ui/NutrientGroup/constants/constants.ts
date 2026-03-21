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
    },
    // {
    //     name: 'aminoAcids',
    //     displayName: 'Аминокислоты',
    //     content: [
    //         { id: '40', name: 'tryptophan', symbol: 'Trp', displayName: 'Tryptophan', displayNameRu: 'Триптофан', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '41', name: 'threonine', symbol: 'Thr', displayName: 'Threonine', displayNameRu: 'Треонин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '42', name: 'isoleucine', symbol: 'Ile', displayName: 'Isoleucine', displayNameRu: 'Изолейцин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '43', name: 'leucine', symbol: 'Leu', displayName: 'Leucine', displayNameRu: 'Лейцин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '44', name: 'lysine', symbol: 'Lys', displayName: 'Lysine', displayNameRu: 'Лизин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '45', name: 'methionine', symbol: 'Met', displayName: 'Methionine', displayNameRu: 'Метионин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '46', name: 'cystine', symbol: 'Cys', displayName: 'Cystine', displayNameRu: 'Цистин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '47', name: 'phenylalanine', symbol: 'Phe', displayName: 'Phenylalanine', displayNameRu: 'Фенилаланин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '48', name: 'tyrosine', symbol: 'Tyr', displayName: 'Tyrosine', displayNameRu: 'Тирозин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '49', name: 'valine', symbol: 'Val', displayName: 'Valine', displayNameRu: 'Валин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '50', name: 'arginine', symbol: 'Arg', displayName: 'Arginine', displayNameRu: 'Аргинин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '51', name: 'histidine', symbol: 'His', displayName: 'Histidine', displayNameRu: 'Гистидин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '52', name: 'alanine', symbol: 'Ala', displayName: 'Alanine', displayNameRu: 'Аланин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '53', name: 'asparticAcid', symbol: 'Asp', displayName: 'Aspartic acid', displayNameRu: 'Аспарагиновая к-та', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '54', name: 'glutamicAcid', symbol: 'Glu', displayName: 'Glutamic acid', displayNameRu: 'Глутаминовая к-та', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '55', name: 'glycine', symbol: 'Gly', displayName: 'Glycine', displayNameRu: 'Глицин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '56', name: 'proline', symbol: 'Pro', displayName: 'Proline', displayNameRu: 'Пролин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '57', name: 'serine', symbol: 'Ser', displayName: 'Serine', displayNameRu: 'Серин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //         { id: '58', name: 'hydroxyproline', symbol: 'Hyp', displayName: 'Hydroxyproline', displayNameRu: 'Гидроксипролин', unit: 'g', unitRu: 'г', group: 'aminoAcids' },
    //     ]
    // }
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
    // Amino acids — essential have daily norms
    40: true,  // tryptophan
    41: true,  // threonine
    42: true,  // isoleucine
    43: true,  // leucine
    44: true,  // lysine
    45: true,  // methionine
    46: false, // cystine
    47: true,  // phenylalanine
    48: false, // tyrosine
    49: true,  // valine
    50: false, // arginine
    51: true,  // histidine
    52: false, // alanine
    53: false, // asparticAcid
    54: false, // glutamicAcid
    55: false, // glycine
    56: false, // proline
    57: false, // serine
    58: false, // hydroxyproline
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
    // Essential amino acids (RDA for 70kg adult, g/day)
    40: 0.28,  // tryptophan (4 mg/kg)
    41: 1.05,  // threonine (15 mg/kg)
    42: 1.4,   // isoleucine (20 mg/kg)
    43: 2.73,  // leucine (39 mg/kg)
    44: 2.1,   // lysine (30 mg/kg)
    45: 0.73,  // methionine (10.4 mg/kg)
    47: 1.75,  // phenylalanine (25 mg/kg)
    49: 1.82,  // valine (26 mg/kg)
    51: 0.7,   // histidine (10 mg/kg)
};