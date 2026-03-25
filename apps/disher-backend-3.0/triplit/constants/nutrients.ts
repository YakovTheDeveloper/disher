/**
 * Shared nutrient constants — single source of truth for both backend and frontend.
 *
 * IDs match the USDA→project mapping in parser/usda/nutrient-map.ts.
 * Frontend imports via @triplit-schema/constants/nutrients.
 */

// ─── Types ───

export type NutrientDef = {
  id: string;
  name: string;
  nameEng: string;
  displayName: string;
  displayNameEng: string;
  unit: string;
  unitEng: string;
  symbol: string;
  group: NutrientGroupName;
};

export type NutrientGroupName =
  | "main"
  | "minerals"
  | "vitaminsB"
  | "vitamins"
  | "fattyAcids"
  | "aminoAcids";

export type NutrientGroupDef = {
  name: NutrientGroupName;
  displayName: string;
  content: NutrientDef[];
};

// ─── Nutrient definitions ───

const main: NutrientDef[] = [
  { id: "1",  name: "protein",       nameEng: "Protein",       displayName: "Белки",       displayNameEng: "Protein",       unit: "г",    unitEng: "g",    symbol: "PRO",  group: "main" },
  { id: "2",  name: "fats",          nameEng: "Fats",          displayName: "Жиры",        displayNameEng: "Fats",          unit: "г",    unitEng: "g",    symbol: "FAT",  group: "main" },
  { id: "3",  name: "carbohydrates", nameEng: "Carbohydrates", displayName: "Углеводы",    displayNameEng: "Carbohydrates", unit: "г",    unitEng: "g",    symbol: "CARB", group: "main" },
  { id: "4",  name: "sugar",         nameEng: "Sugar",         displayName: "Сахар",       displayNameEng: "Sugar",         unit: "г",    unitEng: "g",    symbol: "SUG",  group: "main" },
  { id: "5",  name: "starch",        nameEng: "Starch",        displayName: "Крахмал",     displayNameEng: "Starch",        unit: "г",    unitEng: "g",    symbol: "STA",  group: "main" },
  { id: "6",  name: "fiber",         nameEng: "Fiber",         displayName: "Клетчатка",   displayNameEng: "Fiber",         unit: "г",    unitEng: "g",    symbol: "FIB",  group: "main" },
  { id: "7",  name: "energy",        nameEng: "kcal",          displayName: "Энергия",     displayNameEng: "kcal",          unit: "ккал", unitEng: "kcal", symbol: "kcal", group: "main" },
  { id: "8",  name: "water",         nameEng: "Water",         displayName: "Вода",        displayNameEng: "Water",         unit: "г",    unitEng: "g",    symbol: "H₂O",  group: "main" },
];

const minerals: NutrientDef[] = [
  { id: "9",  name: "iron",      nameEng: "Iron",      displayName: "Железо",   displayNameEng: "Iron",      unit: "мг",  unitEng: "mg", symbol: "Fe", group: "minerals" },
  { id: "10", name: "magnesium", nameEng: "Magnesium", displayName: "Магний",   displayNameEng: "Magnesium", unit: "мг",  unitEng: "mg", symbol: "Mg", group: "minerals" },
  { id: "11", name: "phosphorus",nameEng: "Phosphorus",displayName: "Фосфор",   displayNameEng: "Phosphorus",unit: "мг",  unitEng: "mg", symbol: "P",  group: "minerals" },
  { id: "12", name: "calcium",   nameEng: "Calcium",   displayName: "Кальций",  displayNameEng: "Calcium",   unit: "мг",  unitEng: "mg", symbol: "Ca", group: "minerals" },
  { id: "13", name: "potassium", nameEng: "Potassium", displayName: "Калий",    displayNameEng: "Potassium", unit: "мг",  unitEng: "mg", symbol: "K",  group: "minerals" },
  { id: "14", name: "sodium",    nameEng: "Sodium",    displayName: "Натрий",   displayNameEng: "Sodium",    unit: "мг",  unitEng: "mg", symbol: "Na", group: "minerals" },
  { id: "15", name: "zinc",      nameEng: "Zinc",      displayName: "Цинк",     displayNameEng: "Zinc",      unit: "мг",  unitEng: "mg", symbol: "Zn", group: "minerals" },
  { id: "16", name: "copper",    nameEng: "Copper",    displayName: "Медь",     displayNameEng: "Copper",    unit: "мкг", unitEng: "μg", symbol: "Cu", group: "minerals" },
  { id: "17", name: "manganese", nameEng: "Manganese", displayName: "Марганец", displayNameEng: "Manganese", unit: "мкг", unitEng: "μg", symbol: "Mn", group: "minerals" },
  { id: "18", name: "selenium",  nameEng: "Selenium",  displayName: "Селен",    displayNameEng: "Selenium",  unit: "мкг", unitEng: "μg", symbol: "Se", group: "minerals" },
  { id: "19", name: "iodine",    nameEng: "Iodine",    displayName: "Йод",      displayNameEng: "Iodine",    unit: "мкг", unitEng: "μg", symbol: "I",  group: "minerals" },
];

const vitaminsB: NutrientDef[] = [
  { id: "21", name: "vitaminB1",  nameEng: "Thiamine",         displayName: "Тиамин",               displayNameEng: "Thiamine",         unit: "мг",  unitEng: "mg", symbol: "B1",  group: "vitaminsB" },
  { id: "22", name: "vitaminB2",  nameEng: "Riboflavin",       displayName: "Рибофлавин",           displayNameEng: "Riboflavin",       unit: "мг",  unitEng: "mg", symbol: "B2",  group: "vitaminsB" },
  { id: "23", name: "vitaminB3",  nameEng: "Niacin",           displayName: "Ниацин",               displayNameEng: "Niacin",           unit: "мг",  unitEng: "mg", symbol: "B3",  group: "vitaminsB" },
  { id: "24", name: "vitaminB4",  nameEng: "Choline",          displayName: "Холин",                displayNameEng: "Choline",          unit: "мг",  unitEng: "mg", symbol: "B4",  group: "vitaminsB" },
  { id: "25", name: "vitaminB5",  nameEng: "Pantothenic acid", displayName: "Пантотеновая кислота", displayNameEng: "Pantothenic acid", unit: "мг",  unitEng: "mg", symbol: "B5",  group: "vitaminsB" },
  { id: "26", name: "vitaminB6",  nameEng: "Pyridoxine",       displayName: "Пиридоксин",           displayNameEng: "Pyridoxine",       unit: "мг",  unitEng: "mg", symbol: "B6",  group: "vitaminsB" },
  { id: "27", name: "vitaminB7",  nameEng: "Biotin",           displayName: "Биотин",               displayNameEng: "Biotin",           unit: "мг",  unitEng: "mg", symbol: "B7",  group: "vitaminsB" },
  { id: "28", name: "vitaminB9",  nameEng: "Folate",           displayName: "Фолиевая кислота",     displayNameEng: "Folate",           unit: "мкг", unitEng: "μg", symbol: "B9",  group: "vitaminsB" },
  { id: "29", name: "vitaminB12", nameEng: "Cobalamin",        displayName: "Кобаламин",            displayNameEng: "Cobalamin",        unit: "мкг", unitEng: "μg", symbol: "B12", group: "vitaminsB" },
];

const vitamins: NutrientDef[] = [
  { id: "20", name: "vitaminA",       nameEng: "Vitamin A",       displayName: "Витамин A",    displayNameEng: "Vitamin A",       unit: "мкг", unitEng: "μg", symbol: "A",  group: "vitamins" },
  { id: "30", name: "vitaminC",       nameEng: "Vitamin C",       displayName: "Витамин C",    displayNameEng: "Vitamin C",       unit: "мг",  unitEng: "mg", symbol: "C",  group: "vitamins" },
  { id: "31", name: "vitaminD",       nameEng: "Vitamin D",       displayName: "Витамин D",    displayNameEng: "Vitamin D",       unit: "мкг", unitEng: "μg", symbol: "D",  group: "vitamins" },
  { id: "32", name: "vitaminE",       nameEng: "Vitamin E",       displayName: "Витамин E",    displayNameEng: "Vitamin E",       unit: "мг",  unitEng: "mg", symbol: "E",  group: "vitamins" },
  { id: "33", name: "vitaminK",       nameEng: "Vitamin K",       displayName: "Витамин K",    displayNameEng: "Vitamin K",       unit: "мкг", unitEng: "μg", symbol: "K₁", group: "vitamins" },
  { id: "34", name: "betaCarotene",   nameEng: "Beta-carotene",   displayName: "Бета-каротин", displayNameEng: "Beta-carotene",   unit: "мкг", unitEng: "μg", symbol: "βC", group: "vitamins" },
  { id: "35", name: "alphaCarotene",  nameEng: "Alpha-carotene",  displayName: "Альфа-каротин",displayNameEng: "Alpha-carotene",  unit: "мкг", unitEng: "μg", symbol: "αC", group: "vitamins" },
];

const fattyAcids: NutrientDef[] = [
  { id: "59", name: "saturatedFat",       nameEng: "Saturated fat",       displayName: "Насыщенные жиры",       displayNameEng: "Saturated fat",       unit: "г",  unitEng: "g",  symbol: "SFA",  group: "fattyAcids" },
  { id: "60", name: "monounsaturatedFat", nameEng: "Monounsaturated fat", displayName: "Мононенасыщенные жиры", displayNameEng: "Monounsaturated fat", unit: "г",  unitEng: "g",  symbol: "MUFA", group: "fattyAcids" },
  { id: "61", name: "polyunsaturatedFat", nameEng: "Polyunsaturated fat", displayName: "Полиненасыщенные жиры", displayNameEng: "Polyunsaturated fat", unit: "г",  unitEng: "g",  symbol: "PUFA", group: "fattyAcids" },
  { id: "62", name: "transFat",           nameEng: "Trans fat",           displayName: "Трансжиры",             displayNameEng: "Trans fat",           unit: "г",  unitEng: "g",  symbol: "TFA",  group: "fattyAcids" },
  { id: "63", name: "cholesterol",        nameEng: "Cholesterol",         displayName: "Холестерин",            displayNameEng: "Cholesterol",         unit: "мг", unitEng: "mg", symbol: "CHOL", group: "fattyAcids" },
  { id: "64", name: "omega3EPA",          nameEng: "Omega-3 EPA",         displayName: "Омега-3 EPA",           displayNameEng: "Omega-3 EPA",         unit: "г",  unitEng: "g",  symbol: "EPA",  group: "fattyAcids" },
  { id: "65", name: "omega3DHA",          nameEng: "Omega-3 DHA",         displayName: "Омега-3 DHA",           displayNameEng: "Omega-3 DHA",         unit: "г",  unitEng: "g",  symbol: "DHA",  group: "fattyAcids" },
  { id: "66", name: "omega3ALA",          nameEng: "Omega-3 ALA",         displayName: "Омега-3 ALA",           displayNameEng: "Omega-3 ALA",         unit: "г",  unitEng: "g",  symbol: "ALA",  group: "fattyAcids" },
];

const aminoAcids: NutrientDef[] = [
  { id: "40", name: "tryptophan",      nameEng: "Tryptophan",      displayName: "Триптофан",          displayNameEng: "Tryptophan",      unit: "г", unitEng: "g", symbol: "Trp", group: "aminoAcids" },
  { id: "41", name: "threonine",       nameEng: "Threonine",       displayName: "Треонин",            displayNameEng: "Threonine",       unit: "г", unitEng: "g", symbol: "Thr", group: "aminoAcids" },
  { id: "42", name: "isoleucine",      nameEng: "Isoleucine",      displayName: "Изолейцин",          displayNameEng: "Isoleucine",      unit: "г", unitEng: "g", symbol: "Ile", group: "aminoAcids" },
  { id: "43", name: "leucine",         nameEng: "Leucine",         displayName: "Лейцин",             displayNameEng: "Leucine",         unit: "г", unitEng: "g", symbol: "Leu", group: "aminoAcids" },
  { id: "44", name: "lysine",          nameEng: "Lysine",          displayName: "Лизин",              displayNameEng: "Lysine",          unit: "г", unitEng: "g", symbol: "Lys", group: "aminoAcids" },
  { id: "45", name: "methionine",      nameEng: "Methionine",      displayName: "Метионин",           displayNameEng: "Methionine",      unit: "г", unitEng: "g", symbol: "Met", group: "aminoAcids" },
  { id: "46", name: "cystine",         nameEng: "Cystine",         displayName: "Цистин",             displayNameEng: "Cystine",         unit: "г", unitEng: "g", symbol: "Cys", group: "aminoAcids" },
  { id: "47", name: "phenylalanine",   nameEng: "Phenylalanine",   displayName: "Фенилаланин",        displayNameEng: "Phenylalanine",   unit: "г", unitEng: "g", symbol: "Phe", group: "aminoAcids" },
  { id: "48", name: "tyrosine",        nameEng: "Tyrosine",        displayName: "Тирозин",            displayNameEng: "Tyrosine",        unit: "г", unitEng: "g", symbol: "Tyr", group: "aminoAcids" },
  { id: "49", name: "valine",          nameEng: "Valine",          displayName: "Валин",              displayNameEng: "Valine",          unit: "г", unitEng: "g", symbol: "Val", group: "aminoAcids" },
  { id: "50", name: "arginine",        nameEng: "Arginine",        displayName: "Аргинин",            displayNameEng: "Arginine",        unit: "г", unitEng: "g", symbol: "Arg", group: "aminoAcids" },
  { id: "51", name: "histidine",       nameEng: "Histidine",       displayName: "Гистидин",           displayNameEng: "Histidine",       unit: "г", unitEng: "g", symbol: "His", group: "aminoAcids" },
  { id: "52", name: "alanine",         nameEng: "Alanine",         displayName: "Аланин",             displayNameEng: "Alanine",         unit: "г", unitEng: "g", symbol: "Ala", group: "aminoAcids" },
  { id: "53", name: "asparticAcid",    nameEng: "Aspartic acid",   displayName: "Аспарагиновая к-та", displayNameEng: "Aspartic acid",   unit: "г", unitEng: "g", symbol: "Asp", group: "aminoAcids" },
  { id: "54", name: "glutamicAcid",    nameEng: "Glutamic acid",   displayName: "Глутаминовая к-та",  displayNameEng: "Glutamic acid",   unit: "г", unitEng: "g", symbol: "Glu", group: "aminoAcids" },
  { id: "55", name: "glycine",         nameEng: "Glycine",         displayName: "Глицин",             displayNameEng: "Glycine",         unit: "г", unitEng: "g", symbol: "Gly", group: "aminoAcids" },
  { id: "56", name: "proline",         nameEng: "Proline",         displayName: "Пролин",             displayNameEng: "Proline",         unit: "г", unitEng: "g", symbol: "Pro", group: "aminoAcids" },
  { id: "57", name: "serine",          nameEng: "Serine",          displayName: "Серин",              displayNameEng: "Serine",          unit: "г", unitEng: "g", symbol: "Ser", group: "aminoAcids" },
  { id: "58", name: "hydroxyproline",  nameEng: "Hydroxyproline",  displayName: "Гидроксипролин",     displayNameEng: "Hydroxyproline",  unit: "г", unitEng: "g", symbol: "Hyp", group: "aminoAcids" },
];

// ─── Exported groups & lookups ───

export const nutrientGroups: NutrientGroupDef[] = [
  { name: "main",       displayName: "Основные",           content: main },
  { name: "minerals",   displayName: "Минералы",           content: minerals },
  { name: "vitaminsB",  displayName: "Витамины Б",         content: vitaminsB },
  { name: "vitamins",   displayName: "Остальные витамины",  content: vitamins },
  { name: "fattyAcids", displayName: "Жирные кислоты",     content: fattyAcids },
  { name: "aminoAcids", displayName: "Аминокислоты",       content: aminoAcids },
];

/** Flat list of all nutrients */
export const NUTRIENTS: NutrientDef[] = nutrientGroups.flatMap((g) => g.content);

/** O(1) lookup by nutrient ID */
export const NUTRIENTS_BY_ID: Map<string, NutrientDef> = new Map(
  NUTRIENTS.map((n) => [n.id, n]),
);

// ─── Daily norms ───

/** Default recommended daily intake per nutrient ID */
export const DEFAULT_DAILY_NORMS: Record<string, number> = {
  // Main
  "1": 51,    // protein (g)
  "2": 70,    // fats (g)
  "3": 275,   // carbohydrates (g)
  "4": 50,    // sugar (g)
  "5": 30,    // starch (g)
  "6": 25,    // fiber (g)
  "7": 2000,  // energy (kcal)
  "8": 2000,  // water (g)
  // Minerals
  "9": 18,    // iron (mg)
  "10": 400,  // magnesium (mg)  — was 1000 in frontend, 400 in backend; using backend
  "11": 700,  // phosphorus (mg) — was 350 in frontend, 700 in backend; using backend
  "12": 1000, // calcium (mg)    — was 700 in frontend, 1000 in backend; using backend
  "13": 3500, // potassium (mg)
  "14": 2300, // sodium (mg)
  "15": 11,   // zinc (mg)       — was 15 in frontend; using backend
  "16": 900,  // copper (μg)
  "17": 2300, // manganese (μg)
  "18": 55,   // selenium (μg)
  "19": 150,  // iodine (μg)
  // Vitamins
  "20": 900,  // vitaminA (μg)
  "21": 1.2,  // B1 (mg)
  "22": 1.3,  // B2 (mg)
  "23": 16,   // B3 (mg)
  "24": 550,  // B4 (mg)
  "25": 5,    // B5 (mg)
  "26": 1.3,  // B6 (mg)
  "28": 400,  // B9 (μg)
  "29": 2.4,  // B12 (μg)
  "30": 90,   // vitaminC (mg)
  "31": 15,   // vitaminD (μg)   — was 20 in frontend; using backend
  "32": 15,   // vitaminE (mg)
  "33": 120,  // vitaminK (μg)
  "34": 3000, // betaCarotene (μg)
  "35": 600,  // alphaCarotene (μg)
  // Amino acids (RDA for 70kg adult, g/day)
  "40": 0.28, // tryptophan
  "41": 1.05, // threonine
  "42": 1.4,  // isoleucine
  "43": 2.73, // leucine
  "44": 2.1,  // lysine
  "45": 0.73, // methionine
  "47": 1.75, // phenylalanine
  "49": 1.82, // valine
  "51": 0.7,  // histidine
};

/** Whether a nutrient has a daily norm (for UI: show/hide norm bar) */
export const NUTRIENTS_HAVE_DAILY_NORM: Record<string, boolean> = {
  "1": true,   // protein
  "2": true,   // fats
  "3": true,   // carbohydrates
  "4": false,  // sugar
  "5": false,  // starch
  "6": true,   // fiber
  "7": true,   // energy
  "8": true,   // water
  "9": true,   // iron
  "10": true,  // magnesium
  "11": true,  // phosphorus
  "12": true,  // calcium
  "13": true,  // potassium
  "14": true,  // sodium
  "15": true,  // zinc
  "16": true,  // copper
  "17": true,  // manganese
  "18": true,  // selenium
  "19": true,  // iodine
  "20": true,  // vitaminA
  "21": true,  // B1
  "22": true,  // B2
  "23": true,  // B3
  "24": true,  // B4
  "25": true,  // B5
  "26": true,  // B6
  "27": false, // B7
  "28": true,  // B9
  "29": true,  // B12
  "30": true,  // vitaminC
  "31": true,  // vitaminD
  "32": true,  // vitaminE
  "33": true,  // vitaminK
  "34": false, // betaCarotene
  "35": false, // alphaCarotene
  // Amino acids — essential have daily norms
  "40": true,  // tryptophan
  "41": true,  // threonine
  "42": true,  // isoleucine
  "43": true,  // leucine
  "44": true,  // lysine
  "45": true,  // methionine
  "46": false, // cystine
  "47": true,  // phenylalanine
  "48": false, // tyrosine
  "49": true,  // valine
  "50": false, // arginine
  "51": true,  // histidine
  "52": false, // alanine
  "53": false, // asparticAcid
  "54": false, // glutamicAcid
  "55": false, // glycine
  "56": false, // proline
  "57": false, // serine
  "58": false, // hydroxyproline
};
