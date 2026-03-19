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
      { id: "30", name: "vitaminA", nameEng: "Vitamin A", displayName: "Витамин А", displayNameEng: "Vitamin A", unit: "мкг", unitEng: "μg" },
      { id: "31", name: "vitaminC", nameEng: "Vitamin C", displayName: "Витамин С", displayNameEng: "Vitamin C", unit: "мг", unitEng: "mg" },
      { id: "32", name: "vitaminD", nameEng: "Vitamin D", displayName: "Витамин D", displayNameEng: "Vitamin D", unit: "мкг", unitEng: "μg" },
      { id: "33", name: "vitaminE", nameEng: "Vitamin E", displayName: "Витамин Е", displayNameEng: "Vitamin E", unit: "мг", unitEng: "mg" },
      { id: "34", name: "vitaminK", nameEng: "Vitamin K", displayName: "Витамин К", displayNameEng: "Vitamin K", unit: "мкг", unitEng: "μg" },
      { id: "35", name: "betaCarotene", nameEng: "Beta-carotene", displayName: "Бета-каротин", displayNameEng: "Beta-carotene", unit: "мкг", unitEng: "μg" },
      { id: "36", name: "alphaCarotene", nameEng: "Alpha-carotene", displayName: "Альфа-каротин", displayNameEng: "Alpha-carotene", unit: "мкг", unitEng: "μg" },
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
  console.log("Seeding foods from foodFull.json...");

  const foodPath = resolve(__dirname, "../../food-calc/public/foodFull.json");
  let foods: Array<{
    id: string;
    name: string;
    description?: string;
    nutrients?: Array<{ nutrientId: string; quantity: number }>;
  }>;

  try {
    foods = JSON.parse(readFileSync(foodPath, "utf-8"));
  } catch (e) {
    console.error("  Could not read foodFull.json:", e);
    return;
  }

  console.log(`  Found ${foods.length} foods, inserting...`);

  let inserted = 0;
  let skipped = 0;

  for (const food of foods) {
    try {
      await client.insert("foods", {
        id: food.id,
        userId: "__system__",
        name: food.name,
        nameEng: "",
        description: food.description ?? null,
        descriptionEng: null,
      });
      inserted++;

      // Insert nutrients for this food
      if (food.nutrients) {
        for (const n of food.nutrients) {
          try {
            await client.insert("foodNutrients", {
              id: `${food.id}-${n.nutrientId}`,
              foodId: food.id,
              nutrientId: n.nutrientId,
              quantity: n.quantity,
            });
          } catch {
            // skip
          }
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
    "30": 900, "31": 90, "32": 15, "33": 15, "34": 120,
  };

  const existingNorm = await client.fetchById("dailyNorms", "DEFAULT_NORM");
  if (existingNorm) {
    if (existingNorm.userId !== "__system__") {
      await client.update("dailyNorms", "DEFAULT_NORM", (norm) => {
        norm.userId = "__system__";
      });
      console.log("  Updated DEFAULT_NORM userId to __system__");
    }
  } else {
    await client.insert("dailyNorms", {
      id: "DEFAULT_NORM",
      name: "Стандарт",
      description: "Стандартная норма потребления",
      userId: "__system__",
    });
  }

  for (const [nutrientId, quantity] of Object.entries(defaults)) {
    const itemId = `default-${nutrientId}`;
    const existing = await client.fetchById("dailyNormItems", itemId);
    if (existing) {
      if (existing.userId !== "__system__") {
        await client.update("dailyNormItems", itemId, (item) => {
          item.userId = "__system__";
        });
      }
    } else {
      await client.insert("dailyNormItems", {
        id: itemId,
        normId: "DEFAULT_NORM",
        nutrientId,
        quantity,
        userId: "__system__",
      });
    }
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
