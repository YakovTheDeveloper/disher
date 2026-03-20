import { BulkInsert } from "@triplit/client";
import { schema } from "../schema.js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Nutrients ───

const nutrients = [
  { id: "1",  name: "protein",        nameEng: "Protein",           displayName: "Белки",                 displayNameEng: "Protein",           unit: "г",   unitEng: "g"  },
  { id: "2",  name: "fats",           nameEng: "Fats",              displayName: "Жиры",                  displayNameEng: "Fats",              unit: "г",   unitEng: "g"  },
  { id: "3",  name: "carbohydrates",  nameEng: "Carbohydrates",     displayName: "Углеводы",              displayNameEng: "Carbohydrates",     unit: "г",   unitEng: "g"  },
  { id: "4",  name: "sugar",          nameEng: "Sugar",             displayName: "Сахар",                 displayNameEng: "Sugar",             unit: "г",   unitEng: "g"  },
  { id: "5",  name: "starch",         nameEng: "Starch",            displayName: "Крахмал",               displayNameEng: "Starch",            unit: "г",   unitEng: "g"  },
  { id: "6",  name: "fiber",          nameEng: "Fiber",             displayName: "Клетчатка",             displayNameEng: "Fiber",             unit: "г",   unitEng: "g"  },
  { id: "7",  name: "energy",         nameEng: "kcal",              displayName: "Энергия",               displayNameEng: "kcal",              unit: "ккал",unitEng: "kcal"},
  { id: "8",  name: "water",          nameEng: "Water",             displayName: "Вода",                  displayNameEng: "Water",             unit: "г",   unitEng: "g"  },
  { id: "9",  name: "iron",           nameEng: "Iron",              displayName: "Железо",                displayNameEng: "Iron",              unit: "мг",  unitEng: "mg" },
  { id: "10", name: "magnesium",      nameEng: "Magnesium",         displayName: "Магний",                displayNameEng: "Magnesium",         unit: "мг",  unitEng: "mg" },
  { id: "11", name: "phosphorus",     nameEng: "Phosphorus",        displayName: "Фосфор",                displayNameEng: "Phosphorus",        unit: "мг",  unitEng: "mg" },
  { id: "12", name: "calcium",        nameEng: "Calcium",           displayName: "Кальций",               displayNameEng: "Calcium",           unit: "мг",  unitEng: "mg" },
  { id: "13", name: "potassium",      nameEng: "Potassium",         displayName: "Калий",                 displayNameEng: "Potassium",         unit: "мг",  unitEng: "mg" },
  { id: "14", name: "sodium",         nameEng: "Sodium",            displayName: "Натрий",                displayNameEng: "Sodium",            unit: "мг",  unitEng: "mg" },
  { id: "15", name: "zinc",           nameEng: "Zinc",              displayName: "Цинк",                  displayNameEng: "Zinc",              unit: "мг",  unitEng: "mg" },
  { id: "16", name: "copper",         nameEng: "Copper",            displayName: "Медь",                  displayNameEng: "Copper",            unit: "мкг", unitEng: "μg" },
  { id: "17", name: "manganese",      nameEng: "Manganese",         displayName: "Марганец",              displayNameEng: "Manganese",         unit: "мкг", unitEng: "μg" },
  { id: "18", name: "selenium",       nameEng: "Selenium",          displayName: "Селен",                 displayNameEng: "Selenium",          unit: "мкг", unitEng: "μg" },
  { id: "19", name: "iodine",         nameEng: "Iodine",            displayName: "Йод",                   displayNameEng: "Iodine",            unit: "мкг", unitEng: "μg" },
  { id: "21", name: "vitaminB1",      nameEng: "Thiamine",          displayName: "Тиамин",                displayNameEng: "Thiamine",          unit: "мг",  unitEng: "mg" },
  { id: "22", name: "vitaminB2",      nameEng: "Riboflavin",        displayName: "Рибофлавин",            displayNameEng: "Riboflavin",        unit: "мг",  unitEng: "mg" },
  { id: "23", name: "vitaminB3",      nameEng: "Niacin",            displayName: "Ниацин",                displayNameEng: "Niacin",            unit: "мг",  unitEng: "mg" },
  { id: "24", name: "vitaminB4",      nameEng: "Choline",           displayName: "Холин",                 displayNameEng: "Choline",           unit: "мг",  unitEng: "mg" },
  { id: "25", name: "vitaminB5",      nameEng: "Pantothenic acid",  displayName: "Пантотеновая кислота",  displayNameEng: "Pantothenic acid",  unit: "мг",  unitEng: "mg" },
  { id: "26", name: "vitaminB6",      nameEng: "Pyridoxine",        displayName: "Пиридоксин",            displayNameEng: "Pyridoxine",        unit: "мг",  unitEng: "mg" },
  { id: "27", name: "vitaminB7",      nameEng: "Biotin",            displayName: "Биотин",                displayNameEng: "Biotin",            unit: "мг",  unitEng: "mg" },
  { id: "28", name: "vitaminB9",      nameEng: "Folate",            displayName: "Фолиевая кислота",      displayNameEng: "Folate",            unit: "мкг", unitEng: "μg" },
  { id: "29", name: "vitaminB12",     nameEng: "Cobalamin",         displayName: "Кобаламин",             displayNameEng: "Cobalamin",         unit: "мкг", unitEng: "μg" },
  { id: "30", name: "vitaminA",       nameEng: "Vitamin A",         displayName: "Витамин А",             displayNameEng: "Vitamin A",         unit: "мкг", unitEng: "μg" },
  { id: "31", name: "vitaminC",       nameEng: "Vitamin C",         displayName: "Витамин С",             displayNameEng: "Vitamin C",         unit: "мг",  unitEng: "mg" },
  { id: "32", name: "vitaminD",       nameEng: "Vitamin D",         displayName: "Витамин D",             displayNameEng: "Vitamin D",         unit: "мкг", unitEng: "μg" },
  { id: "33", name: "vitaminE",       nameEng: "Vitamin E",         displayName: "Витамин Е",             displayNameEng: "Vitamin E",         unit: "мг",  unitEng: "mg" },
  { id: "34", name: "vitaminK",       nameEng: "Vitamin K",         displayName: "Витамин К",             displayNameEng: "Vitamin K",         unit: "мкг", unitEng: "μg" },
  { id: "35", name: "betaCarotene",   nameEng: "Beta-carotene",     displayName: "Бета-каротин",          displayNameEng: "Beta-carotene",     unit: "мкг", unitEng: "μg" },
  { id: "36", name: "alphaCarotene",  nameEng: "Alpha-carotene",    displayName: "Альфа-каротин",         displayNameEng: "Alpha-carotene",    unit: "мкг", unitEng: "μg" },
];

// ─── Daily norm ───

const dailyNormDefaults: Record<string, number> = {
  "1": 70, "2": 70, "3": 300, "4": 50, "6": 25,
  "7": 2000, "8": 2000,
  "9": 18, "10": 400, "11": 700, "12": 1000, "13": 3500,
  "14": 2300, "15": 11, "16": 900, "17": 2300, "18": 55, "19": 150,
  "21": 1.2, "22": 1.3, "23": 16, "24": 550, "25": 5, "26": 1.3,
  "28": 400, "29": 2.4,
  "30": 900, "31": 90, "32": 15, "33": 15, "34": 120,
};

// ─── Foods from JSON ───

type FoodJson = {
  id: string;
  name: string;
  description?: string;
  nutrients?: Array<{ nutrientId: string; quantity: number }>;
};

type FoodNutrientJson = {
  id: number;
  quantity: number;
  nutrientId: number;
  foodId: number;
};

const foodPath = resolve(process.cwd(), "../food-calc/public/foodFull.json");
const rawFoods: FoodJson[] = JSON.parse(readFileSync(foodPath, "utf-8"));

const foodNutrientPath = resolve(process.cwd(), "triplit/FoodNutrient.json");
const rawFoodNutrients: FoodNutrientJson[] = JSON.parse(
  readFileSync(foodNutrientPath, "utf-8")
).FoodNutrient;

export default function seed(): BulkInsert<typeof schema> {
  return {
    nutrients,
    foods: rawFoods.map((f) => ({
      id: f.id,
      userId: "__system__",
      name: f.name,
      nameEng: "",
      description: f.description ?? null,
      descriptionEng: null,
    })),
    foodPortions: [],
    foodNutrients: rawFoodNutrients.map((n) => ({
      id: String(n.id),
      foodId: String(n.foodId),
      nutrientId: String(n.nutrientId),
      quantity: n.quantity,
    })),
    dailyNorms: [
      {
        id: "DEFAULT_NORM",
        name: "Стандарт",
        description: "Стандартная норма потребления",
        userId: "__system__",
      },
    ],
    dailyNormItems: Object.entries(dailyNormDefaults).map(([nutrientId, quantity]) => ({
      id: `default-${nutrientId}`,
      normId: "DEFAULT_NORM",
      nutrientId,
      quantity,
      userId: "__system__",
    })),
    users: [],
    scheduleEvents: [],
    scheduleFoods: [],
    dishes: [],
    dishItems: [],
    accounts: [],
  };
}
