/**
 * Seed script: loads reference data (nutrients, foods) into Triplit.
 *
 * Usage:
 *   1. Start Triplit dev server: npm run dev
 *   2. In another terminal: npx tsx scripts/seed.ts
 *
 * This script:
 *   - Loads nutrient definitions from the frontend constants
 *   - Loads food data from the frontend's public/foodFull.json
 *   - Inserts everything into Triplit via the client SDK
 *
 * It's idempotent — re-running won't create duplicates (uses fixed IDs).
 */

import { TriplitClient } from "@triplit/client";
import { schema } from "../triplit/schema";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { SignJWT } from "jose";
import { config } from "dotenv";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const jwtSecret = process.env.TRIPLIT_JWT_SECRET ?? "secret";
const projectId = process.env.TRIPLIT_PROJECT_ID ?? "local-project-id";

const SERVICE_TOKEN = await new SignJWT({
  "x-triplit-token-type": "secret",
  "x-triplit-project-id": projectId,
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .sign(new TextEncoder().encode(jwtSecret));

const client = new TriplitClient({
  schema,
  serverUrl: "http://localhost:6543",
  token: SERVICE_TOKEN,
});

// ─── Nutrient definitions ───

const nutrientGroups = [
  {
    name: "main",
    content: [
      { id: "1", name: "protein", nameEng: "Protein", displayName: "Белки", displayNameEng: "Protein", unit: "г", unitEng: "g" },
      { id: "2", name: "fats", nameEng: "Fats", displayName: "Жиры", displayNameEng: "Fats", unit: "г", unitEng: "g" },
      { id: "3", name: "carbohydrates", nameEng: "Carbohydrates", displayName: "Углеводы", displayNameEng: "Carbohydrates", unit: "г", unitEng: "g" },
      { id: "4", name: "sugar", nameEng: "Sugar", displayName: "Сахар", displayNameEng: "Sugar", unit: "г", unitEng: "g" },
      { id: "5", name: "starch", nameEng: "Starch", displayName: "Крахмал", displayNameEng: "Starch", unit: "г", unitEng: "g" },
      { id: "6", name: "fiber", nameEng: "Fiber", displayName: "Клетчатка", displayNameEng: "Fiber", unit: "г", unitEng: "g" },
      { id: "7", name: "energy", nameEng: "kcal", displayName: "Энергия", displayNameEng: "kcal", unit: "ккал", unitEng: "kcal" },
      { id: "8", name: "water", nameEng: "Water", displayName: "Вода", displayNameEng: "Water", unit: "г", unitEng: "g" },
    ],
  },
  {
    name: "vitaminsB",
    content: [
      { id: "21", name: "vitaminB1", nameEng: "Thiamine", displayName: "Тиамин", displayNameEng: "Thiamine", unit: "мг", unitEng: "mg" },
      { id: "22", name: "vitaminB2", nameEng: "Riboflavin", displayName: "Рибофлавин", displayNameEng: "Riboflavin", unit: "мг", unitEng: "mg" },
      { id: "23", name: "vitaminB3", nameEng: "Niacin", displayName: "Ниацин", displayNameEng: "Niacin", unit: "мг", unitEng: "mg" },
      { id: "24", name: "vitaminB4", nameEng: "Choline", displayName: "Холин", displayNameEng: "Choline", unit: "мг", unitEng: "mg" },
      { id: "25", name: "vitaminB5", nameEng: "Pantothenic acid", displayName: "Пантотеновая кислота", displayNameEng: "Pantothenic acid", unit: "мг", unitEng: "mg" },
      { id: "26", name: "vitaminB6", nameEng: "Pyridoxine", displayName: "Пиридоксин", displayNameEng: "Pyridoxine", unit: "мг", unitEng: "mg" },
      { id: "27", name: "vitaminB7", nameEng: "Biotin", displayName: "Биотин", displayNameEng: "Biotin", unit: "мг", unitEng: "mg" },
      { id: "28", name: "vitaminB9", nameEng: "Folate", displayName: "Фолиевая кислота", displayNameEng: "Folate", unit: "мкг", unitEng: "μg" },
      { id: "29", name: "vitaminB12", nameEng: "Cobalamin", displayName: "Кобаламин", displayNameEng: "Cobalamin", unit: "мкг", unitEng: "μg" },
    ],
  },
  {
    name: "minerals",
    content: [
      { id: "9", name: "iron", nameEng: "Iron", displayName: "Железо", displayNameEng: "Iron", unit: "мг", unitEng: "mg" },
      { id: "10", name: "magnesium", nameEng: "Magnesium", displayName: "Магний", displayNameEng: "Magnesium", unit: "мг", unitEng: "mg" },
      { id: "11", name: "phosphorus", nameEng: "Phosphorus", displayName: "Фосфор", displayNameEng: "Phosphorus", unit: "мг", unitEng: "mg" },
      { id: "12", name: "calcium", nameEng: "Calcium", displayName: "Кальций", displayNameEng: "Calcium", unit: "мг", unitEng: "mg" },
      { id: "13", name: "potassium", nameEng: "Potassium", displayName: "Калий", displayNameEng: "Potassium", unit: "мг", unitEng: "mg" },
      { id: "14", name: "sodium", nameEng: "Sodium", displayName: "Натрий", displayNameEng: "Sodium", unit: "мг", unitEng: "mg" },
      { id: "15", name: "zinc", nameEng: "Zinc", displayName: "Цинк", displayNameEng: "Zinc", unit: "мг", unitEng: "mg" },
      { id: "16", name: "copper", nameEng: "Copper", displayName: "Медь", displayNameEng: "Copper", unit: "мкг", unitEng: "μg" },
      { id: "17", name: "manganese", nameEng: "Manganese", displayName: "Марганец", displayNameEng: "Manganese", unit: "мкг", unitEng: "μg" },
      { id: "18", name: "selenium", nameEng: "Selenium", displayName: "Селен", displayNameEng: "Selenium", unit: "мкг", unitEng: "μg" },
      { id: "19", name: "iodine", nameEng: "Iodine", displayName: "Йод", displayNameEng: "Iodine", unit: "мкг", unitEng: "μg" },
    ],
  },
  {
    name: "vitamins",
    content: [
      { id: "20", name: "vitaminA", nameEng: "Vitamin A", displayName: "Витамин А", displayNameEng: "Vitamin A", unit: "мкг", unitEng: "μg" },
      { id: "30", name: "vitaminC", nameEng: "Vitamin C", displayName: "Витамин С", displayNameEng: "Vitamin C", unit: "мг", unitEng: "mg" },
      { id: "31", name: "vitaminD", nameEng: "Vitamin D", displayName: "Витамин D", displayNameEng: "Vitamin D", unit: "мкг", unitEng: "μg" },
      { id: "32", name: "vitaminE", nameEng: "Vitamin E", displayName: "Витамин Е", displayNameEng: "Vitamin E", unit: "мг", unitEng: "mg" },
      { id: "33", name: "vitaminK", nameEng: "Vitamin K", displayName: "Витамин К", displayNameEng: "Vitamin K", unit: "мкг", unitEng: "μg" },
      { id: "34", name: "betaCarotene", nameEng: "Beta-carotene", displayName: "Бета-каротин", displayNameEng: "Beta-carotene", unit: "мкг", unitEng: "μg" },
      { id: "35", name: "alphaCarotene", nameEng: "Alpha-carotene", displayName: "Альфа-каротин", displayNameEng: "Alpha-carotene", unit: "мкг", unitEng: "μg" },
    ],
  },
  {
    name: "aminoAcids",
    content: [
      { id: "40", name: "tryptophan", nameEng: "Tryptophan", displayName: "Триптофан", displayNameEng: "Tryptophan", unit: "г", unitEng: "g" },
      { id: "41", name: "threonine", nameEng: "Threonine", displayName: "Треонин", displayNameEng: "Threonine", unit: "г", unitEng: "g" },
      { id: "42", name: "isoleucine", nameEng: "Isoleucine", displayName: "Изолейцин", displayNameEng: "Isoleucine", unit: "г", unitEng: "g" },
      { id: "43", name: "leucine", nameEng: "Leucine", displayName: "Лейцин", displayNameEng: "Leucine", unit: "г", unitEng: "g" },
      { id: "44", name: "lysine", nameEng: "Lysine", displayName: "Лизин", displayNameEng: "Lysine", unit: "г", unitEng: "g" },
      { id: "45", name: "methionine", nameEng: "Methionine", displayName: "Метионин", displayNameEng: "Methionine", unit: "г", unitEng: "g" },
      { id: "46", name: "cystine", nameEng: "Cystine", displayName: "Цистин", displayNameEng: "Cystine", unit: "г", unitEng: "g" },
      { id: "47", name: "phenylalanine", nameEng: "Phenylalanine", displayName: "Фенилаланин", displayNameEng: "Phenylalanine", unit: "г", unitEng: "g" },
      { id: "48", name: "tyrosine", nameEng: "Tyrosine", displayName: "Тирозин", displayNameEng: "Tyrosine", unit: "г", unitEng: "g" },
      { id: "49", name: "valine", nameEng: "Valine", displayName: "Валин", displayNameEng: "Valine", unit: "г", unitEng: "g" },
      { id: "50", name: "arginine", nameEng: "Arginine", displayName: "Аргинин", displayNameEng: "Arginine", unit: "г", unitEng: "g" },
      { id: "51", name: "histidine", nameEng: "Histidine", displayName: "Гистидин", displayNameEng: "Histidine", unit: "г", unitEng: "g" },
      { id: "52", name: "alanine", nameEng: "Alanine", displayName: "Аланин", displayNameEng: "Alanine", unit: "г", unitEng: "g" },
      { id: "53", name: "asparticAcid", nameEng: "Aspartic acid", displayName: "Аспарагиновая кислота", displayNameEng: "Aspartic acid", unit: "г", unitEng: "g" },
      { id: "54", name: "glutamicAcid", nameEng: "Glutamic acid", displayName: "Глутаминовая кислота", displayNameEng: "Glutamic acid", unit: "г", unitEng: "g" },
      { id: "55", name: "glycine", nameEng: "Glycine", displayName: "Глицин", displayNameEng: "Glycine", unit: "г", unitEng: "g" },
      { id: "56", name: "proline", nameEng: "Proline", displayName: "Пролин", displayNameEng: "Proline", unit: "г", unitEng: "g" },
      { id: "57", name: "serine", nameEng: "Serine", displayName: "Серин", displayNameEng: "Serine", unit: "г", unitEng: "g" },
      { id: "58", name: "hydroxyproline", nameEng: "Hydroxyproline", displayName: "Гидроксипролин", displayNameEng: "Hydroxyproline", unit: "г", unitEng: "g" },
    ],
  },
];


// ─── Seed functions ───

async function seedNutrients() {
  console.log("Seeding nutrients...");
  const allNutrients = nutrientGroups.flatMap((g) => g.content);

  for (const n of allNutrients) {
    try {
      await client.insert("nutrients", {
        id: n.id,
        name: n.name,
        nameEng: n.nameEng,
        unit: n.unit,
        unitEng: n.unitEng,
        displayName: n.displayName,
        displayNameEng: n.displayNameEng,
      });
    } catch {
      // Already exists, skip
    }
  }
  console.log(`  Seeded ${allNutrients.length} nutrients`);
}

async function seedFoods() {
  const combinedPath = resolve(__dirname, "../parser/output/combined-foods.json");
  await seedFoodsCombined(combinedPath);
}

async function seedFoodsCombined(path: string) {
  console.log("Seeding foods from combined-foods.json...");

  let data: {
    meta: Record<string, unknown>;
    foods: Array<{
      id: string;
      nameEng: string;
      nameRu: string;
      source: string;
      categories: string[];
      nutrients: Array<{ nutrientId: string; quantity: number }>;
      portions: unknown[];
    }>;
  };

  try {
    data = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    console.error("  Could not read combined-foods.json:", e);
    return;
  }

  const foods = data.foods;
  console.log(`  Found ${foods.length} foods, inserting...`);

  let inserted = 0;
  let skipped = 0;

  for (const food of foods) {
    try {
      await client.insert("foods", {
        id: food.id,
        userId: "__system__",
        name: food.nameRu || food.nameEng || food.id,
        nameEng: food.nameEng ?? "",
        description: null,
        descriptionEng: null,
        source: food.source,
        categories: new Set(food.categories ?? []),
      });
      inserted++;

      for (const nutrient of food.nutrients) {
        try {
          await client.insert("foodNutrients", {
            id: `${food.id}-${nutrient.nutrientId}`,
            foodId: food.id,
            nutrientId: nutrient.nutrientId,
            quantity: nutrient.quantity,
          });
        } catch {
          // skip duplicate
        }
      }
    } catch {
      skipped++;
    }

    if ((inserted + skipped) % 200 === 0) {
      console.log(`  Progress: ${inserted} inserted, ${skipped} skipped`);
    }
  }

  console.log(`  Done: ${inserted} inserted, ${skipped} skipped`);
}

async function seedDefaultDailyNorm() {
  console.log("Seeding default daily norm...");

  const defaults: Record<string, number> = {
    "1": 70, "2": 70, "3": 300, "4": 50, "6": 25,
    "7": 2000, "8": 2000,
    "9": 18, "10": 400, "11": 700, "12": 1000, "13": 3500,
    "14": 2300, "15": 11, "16": 900, "17": 2300, "18": 55, "19": 150,
    "21": 1.2, "22": 1.3, "23": 16, "24": 550, "25": 5, "26": 1.3,
    "28": 400, "29": 2.4,
    "20": 900, "30": 90, "31": 15, "32": 15, "33": 120,
  };

  const existingNorm = await client.fetchById("dailyNorms", "DEFAULT_NORM");
  if (existingNorm) {
    if (existingNorm.userId !== "__system__") {
      await client.update("dailyNorms", "DEFAULT_NORM", (norm) => {
        norm.userId = "__system__";
      });
      console.log("  Updated DEFAULT_NORM userId to __system__");
    }
    // Update items to latest defaults
    await client.update("dailyNorms", "DEFAULT_NORM", (norm) => {
      norm.items = defaults;
    });
  } else {
    await client.insert("dailyNorms", {
      id: "DEFAULT_NORM",
      name: "Стандарт",
      description: "Стандартная норма потребления",
      userId: "__system__",
      items: defaults,
    });
  }

  console.log("  Done");
}

// ─── Main ───

async function main() {
  console.log("=== Triplit Seed Script ===\n");

  await seedNutrients();
  await seedFoods();
  await seedDefaultDailyNorm();

  console.log("\n=== Seed complete, waiting for sync... ===");
  await new Promise((r) => setTimeout(r, 5000));
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
