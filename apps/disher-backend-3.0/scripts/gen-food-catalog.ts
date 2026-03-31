/**
 * Generates a food catalog with full details for the application.
 *
 * Reads combined-foods.json and outputs food-catalog-lite.json in ProductWithNutrients format:
 * - Includes id, name (as nameRu), source, categories
 * - Converts nutrients array to Map<string, ProductNutrient>
 * - Filters portions: removes USDA marketing units, ounces, overly-specific variants
 * - Translates portion labels to Russian (labelEng stores original English label)
 *
 * Usage: npx tsx scripts/gen-food-catalog.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const inputPath = resolve(
  __dirname,
  "../seed/combined-foods.json"
);
const outputPath = resolve(__dirname, "../seed/combined-foods-final.json");

interface Portion {
  label: string;
  amount: number;
  unit: string;
  grams: number;
}

interface Nutrient {
  nutrientId: string;
  quantity: number;
}

interface CombinedFood {
  id: string;
  nameRu: string;
  nameEng: string;
  source: string;
  categories: string[];
  nutrients: Nutrient[];
  portions: Portion[];
}

interface CombinedFoodsFile {
  meta: Record<string, unknown>;
  foods: CombinedFood[];
}

// ProductWithNutrients-compatible output format
interface ProductPortion {
  label: string;
  labelEng: string;
  amount: number;
  unit: string;
  grams: number;
}

interface LiteProduct {
  id: string;
  name: string;
  source?: string;
  categories: string[];
  nutrients: Record<string, number>;
  portions: ProductPortion[];
}

// Portion label translations EN → RU
const labelTranslations: Record<string, string> = {
  // Units
  cup: "чашка",
  tbsp: "столовая ложка",
  tsp: "чайная ложка",
  ml: "мл",
  g: "г",
  gram: "грамм",
  oz: "унция",
  "fl oz": "жидкая унция",

  // Preparations
  chopped: "нарезанный",
  sliced: "нарезанный ломтиками",
  diced: "нарезанный кубиками",
  crushed: "измельченный",
  mashed: "пюре",
  shredded: "тёртый",
  whole: "целый",
  halves: "половинки",
  pieces: "кусочки",
  cubes: "кубики",
  packed: "плотно упакованный",
  unpacked: "рыхлый",
  melted: "растопленный",
  pureed: "пюре",

  // Specific items
  "large egg": "большое яйцо",
  "medium egg": "среднее яйцо",
  "small egg": "маленькое яйцо",
  "extra large egg": "очень большое яйцо",
  slice: "ломтик",
  ear: "кочан",
  fillet: "филе",
  breast: "грудка",
  glass: "стакан",
  can: "банка",
  bottle: "бутылка",
  apple: "яблоко",
  banana: "банан",
  orange: "апельсин",
  berry: "ягода",
  berries: "ягоды",
};

// Patterns to filter OUT (regex)
const filterOutPatterns = [
  /^(oz|fl\s+oz)$/i,                           // Ounces
  /^(NLEA|serving|Serving)/i,                  // Marketing units
  /\d+\s*kcal/i,                               // Calorie-based
  /\b(wedge|balls?|stalk|head)\b/i,            // Too specific items
  /\(\d+['"-].*\)/,                            // Size descriptors like (3", 7-1/2")
  /\(.*['\"].*\)/,                             // Any parenthetical with quotes (imperial sizes)
  /[Pp]eeled|[Ee]dible|[Cc]ore/,               // Processing notes
  /\bNS\b.*[Ff]lorida|[Cc]alifornia/i,        // "NS as to Florida or California"
  /(Potato|Carrot|Beet|Radish|Parsnip)\s+(large|medium|small)/i, // Pre-measured vegetables
];

function shouldFilterOutPortion(label: string): boolean {
  return filterOutPatterns.some((pattern) => pattern.test(label));
}

function normalizePortion(label: string): string {
  // Remove amount descriptor at start, keep unit and preparation
  // "cup, chopped" → "cup, chopped"
  // "1 cup chopped" → "cup chopped"
  return label
    .replace(/^[\d\-\/\s]+/, "")           // Remove leading numbers/fractions
    .replace(/\s*\([^)]*\)/g, "")          // Remove parentheses content
    .replace(/^(cup|tbsp|tsp|ml|g)\s+/, "$1, ") // Normalize format to "cup, chopped"
    .trim();
}

function translateLabel(englishLabel: string): string {
  const normalized = normalizePortion(englishLabel).toLowerCase();

  // Check exact matches first
  if (labelTranslations[normalized]) {
    return labelTranslations[normalized];
  }

  // Check partial matches for compound labels (e.g., "cup, chopped")
  const parts = normalized.split(/[,\s]+/).filter(Boolean);
  const translated = parts
    .map((part) => labelTranslations[part] || null)
    .filter((part) => part !== null)
    .join(", ");

  // Only return if we translated at least the main unit
  if (translated && translated.length > 0) {
    return translated;
  }

  // If nothing translated, filter this portion out
  return "";
}

const raw = readFileSync(inputPath, "utf-8");
const data: CombinedFoodsFile = JSON.parse(raw);

let totalRemovedPortions = 0;
let totalTranslatedPortions = 0;

const lite = data.foods.map((f): LiteProduct => {
  // Filter and translate portions
  const processedPortions: ProductPortion[] = [];

  for (const p of f.portions) {
    // Filter out unwanted portions
    if (shouldFilterOutPortion(p.label)) {
      totalRemovedPortions++;
      continue;
    }

    // Try to translate
    const translatedLabel = translateLabel(p.label);

    // Skip if translation failed (empty string means no useful translation found)
    if (!translatedLabel) {
      totalRemovedPortions++;
      continue;
    }

    totalTranslatedPortions++;
    processedPortions.push({
      label: translatedLabel,
      labelEng: p.label,
      amount: p.amount,
      unit: p.unit,
      grams: p.grams,
    });
  }

  // Convert nutrients array to Record<nutrientId, quantity>
  const nutrientsRecord: Record<string, number> = {};
  for (const n of f.nutrients) {
    nutrientsRecord[n.nutrientId] = n.quantity;
  }

  return {
    id: f.id,
    name: f.nameRu,
    source: f.source,
    categories: f.categories,
    nutrients: nutrientsRecord,
    portions: processedPortions,
  };
});

// Lite products are already in the correct format
const liteAsJson = lite;

writeFileSync(outputPath, JSON.stringify(liteAsJson), "utf-8");

console.log(`Generated ${lite.length} entries → ${outputPath}`);
console.log(
  `Size: ${(Buffer.byteLength(JSON.stringify(liteAsJson)) / 1024).toFixed(1)} KB`
);

// Statistics
const totalPortions = lite.reduce((sum, f) => sum + f.portions.length, 0);
const totalNutrients = lite.reduce((sum, f) => sum + Object.keys(f.nutrients).length, 0);

console.log(`\nStatistics:`);
console.log(`  Total products: ${lite.length}`);
console.log(`  Total portions: ${totalPortions}`);
console.log(`  Total nutrients: ${totalNutrients}`);
console.log(`  Removed portions: ${totalRemovedPortions}`);
console.log(`  Translated portions: ${totalTranslatedPortions}`);
