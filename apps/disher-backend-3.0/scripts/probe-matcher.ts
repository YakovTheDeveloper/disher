/**
 * Probes the food matcher against ground truth (product IDs).
 * Reports Recall@1, Recall@3, MRR per category/set. Exits 1 if below thresholds.
 *
 * Usage:
 *   npx tsx scripts/probe-matcher.ts                # all sets
 *   npx tsx scripts/probe-matcher.ts --set=basic    # only basic
 *   npx tsx scripts/probe-matcher.ts --set=tricky   # only tricky
 *   npx tsx scripts/probe-matcher.ts --set=oov      # only OOV (no false positives)
 *   npx tsx scripts/probe-matcher.ts --verbose      # print every case (not just misses)
 *
 * Case shape: { query, expectedIds, cat?, tags? }.
 * - `expectedIds: []` means OOV — nothing in the catalog should match confidently.
 *   These are scored separately as "false positive rate".
 *
 * Updated 2026-04-16 for consolidated catalog v2 (412 products, lowercase names).
 */

import { initMatcher, matchOne } from "../src/api/food-matcher.js";

interface Case {
  query: string;
  expectedIds: string[];
  cat: string;       // category bucket for per-category reporting
  tags?: string[];   // phenomenon tags: diminutive, typo, yofication, reorder, compound, dish, synonym, slang, plural, unit
}

// ─── Test sets ───

// BASIC: canonical names, simple single-word queries. Should be near-100%.
const BASIC: Case[] = [
  // fruit
  { query: "яблоко",       expectedIds: ["sk-880"],            cat: "fruit" },
  { query: "банан",        expectedIds: ["sk-898"],            cat: "fruit" },
  { query: "апельсин",     expectedIds: ["sk-890"],            cat: "fruit" },
  { query: "мандарин",     expectedIds: ["sk-896"],            cat: "fruit" },
  { query: "лимон",        expectedIds: ["sk-894"],            cat: "fruit" },
  { query: "груша",        expectedIds: ["sk-876"],            cat: "fruit" },
  { query: "виноград",     expectedIds: ["sk-899"],            cat: "fruit" },
  { query: "клубника",     expectedIds: ["250"],               cat: "fruit" },
  { query: "малина",       expectedIds: ["sk-903"],            cat: "fruit" },
  { query: "вишня",        expectedIds: ["sk-865"],            cat: "fruit" },
  { query: "черешня",      expectedIds: ["sk-874"],            cat: "fruit" },
  { query: "персик",       expectedIds: ["sk-867"],            cat: "fruit" },
  { query: "абрикос",      expectedIds: ["4185"],              cat: "fruit" },
  { query: "слива",        expectedIds: ["sk-869"],            cat: "fruit" },
  { query: "ананас",       expectedIds: ["sk-897"],            cat: "fruit" },
  { query: "манго",        expectedIds: ["2398"],              cat: "fruit" },
  { query: "киви",         expectedIds: ["sk-886"],            cat: "fruit" },
  { query: "гранат",       expectedIds: ["sk-883"],            cat: "fruit" },
  { query: "хурма",        expectedIds: ["sk-889"],            cat: "fruit" },
  { query: "инжир",        expectedIds: ["sk-884"],            cat: "fruit" },
  { query: "арбуз",        expectedIds: ["sk-918"],            cat: "fruit" },
  { query: "дыня",         expectedIds: ["1580"],              cat: "fruit" },
  { query: "черника",      expectedIds: ["sk-917"],            cat: "fruit" },
  { query: "голубика",     expectedIds: ["sk-913"],            cat: "fruit" },
  { query: "ежевика",      expectedIds: ["sk-914"],            cat: "fruit" },
  { query: "клюква",       expectedIds: ["sk-915"],            cat: "fruit" },
  { query: "смородина",    expectedIds: ["sk-909", "sk-908", "sk-907"], cat: "fruit" },
  { query: "брусника",     expectedIds: ["sk-912"],            cat: "fruit" },
  { query: "авокадо",      expectedIds: ["4193"],              cat: "fruit" },
  { query: "финики",       expectedIds: ["sk-873"],            cat: "fruit" },
  { query: "изюм",         expectedIds: ["sk-900"],            cat: "fruit" },
  { query: "чернослив",    expectedIds: ["sk-870"],            cat: "fruit" },
  { query: "курага",       expectedIds: ["sk-863"],            cat: "fruit" },
  { query: "грейпфрут",    expectedIds: ["sk-892"],            cat: "fruit" },

  // vegetable
  { query: "картофель",    expectedIds: ["sk-746"],            cat: "vegetable" },
  { query: "морковь",      expectedIds: ["sk-773"],            cat: "vegetable" },
  { query: "лук",          expectedIds: ["2488"],              cat: "vegetable" },
  { query: "чеснок",       expectedIds: ["sk-745"],            cat: "vegetable" },
  { query: "огурец",       expectedIds: ["897"],               cat: "vegetable" },
  { query: "помидор",      expectedIds: ["sk-821"],            cat: "vegetable" },
  { query: "капуста",      expectedIds: ["sk-715", "2463"],    cat: "vegetable" },
  { query: "брокколи",     expectedIds: ["2867"],              cat: "vegetable" },
  { query: "цветная капуста", expectedIds: ["sk-735"],         cat: "vegetable" },
  { query: "свекла",       expectedIds: ["sk-784"],            cat: "vegetable" },
  { query: "редис",        expectedIds: ["sk-796"],            cat: "vegetable" },
  { query: "перец",        expectedIds: ["7843", "2594", "custom-1"], cat: "vegetable" },
  { query: "кабачок",      expectedIds: ["sk-827"],            cat: "vegetable" },
  { query: "баклажан",     expectedIds: ["sk-824"],            cat: "vegetable" },
  { query: "тыква",        expectedIds: ["sk-837"],            cat: "vegetable" },
  { query: "спаржа",       expectedIds: ["sk-714"],            cat: "vegetable" },
  { query: "сельдерей",    expectedIds: ["sk-704"],            cat: "vegetable" },
  { query: "укроп",        expectedIds: ["4721"],              cat: "vegetable" },
  { query: "петрушка",     expectedIds: ["sk-702"],            cat: "vegetable" },
  { query: "шпинат",       expectedIds: ["sk-708"],            cat: "vegetable" },
  { query: "руккола",      expectedIds: ["1875"],              cat: "vegetable" },
  { query: "шампиньоны",   expectedIds: ["sk-860"],            cat: "vegetable" },
  { query: "грибы",        expectedIds: ["sk-847", "sk-860"],  cat: "vegetable" },

  // meat/poultry
  { query: "говядина",     expectedIds: ["sk-174"],            cat: "meat" },
  { query: "свинина",      expectedIds: ["sk-181"],            cat: "meat" },
  { query: "баранина",     expectedIds: ["sk-172"],            cat: "meat" },
  { query: "телятина",     expectedIds: ["sk-184"],            cat: "meat" },
  { query: "курица",       expectedIds: ["7881"],              cat: "poultry" },
  { query: "индейка",      expectedIds: ["3586"],              cat: "poultry" },
  { query: "утка",         expectedIds: ["sk-194"],            cat: "poultry" },
  { query: "кролик",       expectedIds: ["6835"],              cat: "meat" },

  // fish/seafood
  { query: "лосось",       expectedIds: ["sk-419"],            cat: "fish" },
  { query: "семга",        expectedIds: ["sk-419"],            cat: "fish" },
  { query: "тунец",        expectedIds: ["sk-463"],            cat: "fish" },
  { query: "треска",       expectedIds: ["4443"],              cat: "fish" },
  { query: "скумбрия",     expectedIds: ["7607"],              cat: "fish" },
  { query: "сельдь",       expectedIds: ["7604"],              cat: "fish" },
  { query: "горбуша",      expectedIds: ["sk-409"],            cat: "fish" },
  { query: "минтай",       expectedIds: ["sk-384"],            cat: "fish" },
  { query: "форель",       expectedIds: ["6205"],              cat: "fish" },
  { query: "креветки",     expectedIds: ["sk-495"],            cat: "seafood" },
  { query: "мидии",        expectedIds: ["sk-502"],            cat: "seafood" },
  { query: "кальмар",      expectedIds: ["sk-501"],            cat: "seafood" },
  { query: "краб",         expectedIds: ["sk-492"],            cat: "seafood" },
  { query: "устрицы",      expectedIds: ["4466"],              cat: "seafood" },

  // dairy/egg
  { query: "молоко",       expectedIds: ["sk-53"],             cat: "dairy" },
  { query: "кефир",        expectedIds: ["sk-9"],              cat: "dairy" },
  { query: "йогурт",       expectedIds: ["3772", "3772"],     cat: "dairy" },
  { query: "творог",       expectedIds: ["sk-78"],             cat: "dairy" },
  { query: "сметана",      expectedIds: ["sk-73"],             cat: "dairy" },
  { query: "сливки",       expectedIds: ["sk-59"],             cat: "dairy" },
  { query: "ряженка",      expectedIds: ["sk-18"],             cat: "dairy" },
  { query: "простокваша",  expectedIds: ["sk-15"],             cat: "dairy" },
  { query: "сыр",          expectedIds: ["sk-145"],            cat: "dairy" },
  { query: "брынза",       expectedIds: ["sk-149"],            cat: "dairy" },
  { query: "сулугуни",     expectedIds: ["sk-150"],            cat: "dairy" },
  { query: "масло сливочное", expectedIds: ["sk-510"],         cat: "dairy" },
  { query: "яйцо",         expectedIds: ["sk-164"],            cat: "egg" },

  // grain/bakery
  { query: "овсянка",      expectedIds: ["sk-638"],            cat: "grain" },
  { query: "гречка",       expectedIds: ["2774"],              cat: "grain" },
  { query: "рис",          expectedIds: ["sk-644"],            cat: "grain" },
  { query: "пшено",        expectedIds: ["sk-666"],            cat: "grain" },
  { query: "манка",        expectedIds: ["sk-614"],            cat: "grain" },
  { query: "перловка",     expectedIds: ["sk-659"],            cat: "grain" },
  { query: "булгур",       expectedIds: ["3176"],              cat: "grain" },
  { query: "киноа",        expectedIds: ["1362"],              cat: "grain" },
  { query: "кускус",       expectedIds: ["2187"],              cat: "grain" },
  { query: "макароны",     expectedIds: ["sk-561"],            cat: "grain" },
  { query: "лапша",        expectedIds: ["sk-558"],            cat: "grain" },
  { query: "хлеб",         expectedIds: ["20"],                cat: "bakery" },
  { query: "батон",        expectedIds: ["sk-587"],            cat: "bakery" },

  // legume/nut/seed
  { query: "фасоль",       expectedIds: ["7811", "7810", "7814"], cat: "legume" },
  { query: "горох",        expectedIds: ["2503"],              cat: "legume" },
  { query: "чечевица",     expectedIds: ["4908"],              cat: "legume" },
  { query: "нут",          expectedIds: ["7865"],              cat: "legume" },
  { query: "соя",          expectedIds: ["1770"],              cat: "legume" },
  { query: "тофу",         expectedIds: ["4963"],              cat: "legume" },
  { query: "грецкий орех", expectedIds: ["sk-690"],            cat: "nut" },
  { query: "миндаль",      expectedIds: ["sk-693"],            cat: "nut" },
  { query: "фундук",       expectedIds: ["3069"],              cat: "nut" },
  { query: "кешью",        expectedIds: ["sk-691"],            cat: "nut" },
  { query: "арахис",       expectedIds: ["sk-689"],            cat: "nut" },
  { query: "кокос",        expectedIds: ["2657"],              cat: "nut" },
  { query: "кунжут",       expectedIds: ["sk-696"],            cat: "seed" },
  { query: "семечки",      expectedIds: ["sk-700"],            cat: "seed" },

  // beverage
  { query: "чай",          expectedIds: ["5715", "4405"],      cat: "beverage" },
  { query: "кофе",         expectedIds: ["4378"],              cat: "beverage" },
  { query: "какао",        expectedIds: ["6611"],              cat: "beverage" },
  { query: "сок яблочный", expectedIds: ["sk-1028"],           cat: "juice" },
  { query: "сок томатный", expectedIds: ["sk-1031"],           cat: "juice" },
  { query: "сок гранатовый", expectedIds: ["sk-1019"],         cat: "juice" },
  { query: "сок апельсиновый", expectedIds: ["sk-1016"],       cat: "juice" },
  { query: "вода",         expectedIds: ["sk-1070"],           cat: "beverage" },

  // dessert/oil/condiment
  { query: "мед",          expectedIds: ["2128"],              cat: "dessert" },
  { query: "сахар",        expectedIds: ["sk-935"],            cat: "dessert" },
  { query: "шоколад",      expectedIds: ["sk-954"],            cat: "dessert" },
  { query: "зефир",        expectedIds: ["sk-949"],            cat: "dessert" },
  { query: "халва",        expectedIds: ["sk-951"],            cat: "dessert" },
  { query: "варенье",      expectedIds: ["sk-923"],            cat: "dessert" },
  { query: "масло оливковое", expectedIds: ["sk-532"],         cat: "oil" },
  { query: "масло подсолнечное", expectedIds: ["sk-534"],      cat: "oil" },
  { query: "майонез",      expectedIds: ["sk-548"],            cat: "oil" },
  { query: "кетчуп",       expectedIds: ["1044"],              cat: "vegetable" },
];

// TRICKY: queries where a naive string match fails. This is the real quality signal.
const TRICKY: Case[] = [
  // diminutives (ласкательные)
  { query: "картошка",        expectedIds: ["sk-746"],             cat: "vegetable", tags: ["diminutive"] },
  { query: "картошечка",      expectedIds: ["sk-746"],             cat: "vegetable", tags: ["diminutive"] },
  { query: "картоха",         expectedIds: ["sk-746"],             cat: "vegetable", tags: ["slang"] },
  { query: "помидорчик",      expectedIds: ["sk-821"],             cat: "vegetable", tags: ["diminutive"] },
  { query: "помидорка",       expectedIds: ["sk-821"],             cat: "vegetable", tags: ["diminutive"] },
  { query: "огурчик",         expectedIds: ["897"],                cat: "vegetable", tags: ["diminutive"] },
  { query: "лучок",           expectedIds: ["2488"],               cat: "vegetable", tags: ["diminutive"] },
  { query: "морковка",        expectedIds: ["sk-773"],             cat: "vegetable", tags: ["diminutive"] },
  { query: "морковочка",      expectedIds: ["sk-773"],             cat: "vegetable", tags: ["diminutive"] },
  { query: "свеколка",        expectedIds: ["sk-784"],             cat: "vegetable", tags: ["diminutive"] },
  { query: "капусточка",      expectedIds: ["sk-715"],             cat: "vegetable", tags: ["diminutive"] },
  { query: "грибочки",        expectedIds: ["sk-860", "sk-847"],   cat: "vegetable", tags: ["diminutive", "plural"] },
  { query: "яблочко",         expectedIds: ["sk-880"],             cat: "fruit",     tags: ["diminutive"] },
  { query: "яблочки",         expectedIds: ["sk-880"],             cat: "fruit",     tags: ["diminutive", "plural"] },
  { query: "бананчик",        expectedIds: ["sk-898"],             cat: "fruit",     tags: ["diminutive"] },
  { query: "клубничка",       expectedIds: ["250"],                cat: "fruit",     tags: ["diminutive"] },
  { query: "ягодки",          expectedIds: ["sk-917", "sk-903", "250"], cat: "fruit", tags: ["diminutive"] },
  { query: "творожок",        expectedIds: ["sk-78"],              cat: "dairy",     tags: ["diminutive"] },
  { query: "молочко",         expectedIds: ["sk-53"],              cat: "dairy",     tags: ["diminutive"] },
  { query: "сырок",           expectedIds: ["sk-145"],             cat: "dairy",     tags: ["diminutive"] },
  { query: "сметанка",        expectedIds: ["sk-73"],              cat: "dairy",     tags: ["diminutive"] },
  { query: "хлебушек",        expectedIds: ["20", "sk-587"],       cat: "bakery",    tags: ["diminutive"] },
  { query: "булочка",         expectedIds: ["sk-587"],             cat: "bakery",    tags: ["diminutive"] },
  { query: "булка",           expectedIds: ["sk-587"],             cat: "bakery",    tags: ["slang"] },
  { query: "рыбка",           expectedIds: ["sk-419", "sk-463", "4443"], cat: "fish", tags: ["diminutive"] },
  { query: "курочка",         expectedIds: ["7881"],               cat: "poultry",   tags: ["diminutive"] },
  { query: "яичко",           expectedIds: ["sk-164"],               cat: "egg",       tags: ["diminutive"] },

  // ё/е normalization
  { query: "свёкла",          expectedIds: ["sk-784"],             cat: "vegetable", tags: ["yofication"] },
  { query: "мёд",             expectedIds: ["2128"],               cat: "dessert",   tags: ["yofication"] },
  { query: "чёрный чай",      expectedIds: ["5715"],               cat: "beverage",  tags: ["yofication"] },
  { query: "зелёный чай",     expectedIds: ["4405"],               cat: "beverage",  tags: ["yofication"] },
  { query: "свёкла варёная",  expectedIds: ["sk-784"],             cat: "vegetable", tags: ["yofication", "compound"] },
  { query: "ёжик из риса",    expectedIds: [],                     cat: "oov",       tags: ["yofication", "dish"] },

  // typos
  { query: "овсянкка",        expectedIds: ["sk-638"],             cat: "grain",     tags: ["typo"] },
  { query: "гречька",         expectedIds: ["2774"],               cat: "grain",     tags: ["typo"] },
  { query: "творок",          expectedIds: ["sk-78"],              cat: "dairy",     tags: ["typo"] },
  { query: "кортошка",        expectedIds: ["sk-746"],             cat: "vegetable", tags: ["typo"] },
  { query: "мондарин",        expectedIds: ["sk-896"],             cat: "fruit",     tags: ["typo"] },
  { query: "йогрут",          expectedIds: ["3772", "3772"],      cat: "dairy",     tags: ["typo"] },
  { query: "шокалад",         expectedIds: ["sk-954"],             cat: "dessert",   tags: ["typo"] },
  { query: "куринная грудка", expectedIds: ["7881"],               cat: "poultry",   tags: ["typo"] },

  // word-order / reorder
  { query: "грудка куриная",  expectedIds: ["7881"],               cat: "poultry",   tags: ["reorder"] },
  { query: "куриная грудка",  expectedIds: ["7881"],               cat: "poultry",   tags: ["reorder"] },
  { query: "каша овсяная",    expectedIds: ["sk-638"],             cat: "grain",     tags: ["reorder"] },
  { query: "овсяная каша",    expectedIds: ["sk-638"],             cat: "grain",     tags: ["reorder"] },
  { query: "капуста белокочанная", expectedIds: ["sk-715"],        cat: "vegetable", tags: ["reorder"] },
  { query: "белокочанная капуста", expectedIds: ["sk-715"],        cat: "vegetable", tags: ["reorder"] },
  { query: "масло оливковое", expectedIds: ["sk-532"],             cat: "oil",       tags: ["reorder"] },
  { query: "оливковое масло", expectedIds: ["sk-532"],             cat: "oil",       tags: ["reorder"] },
  { query: "сок яблочный",    expectedIds: ["sk-1028"],            cat: "juice",     tags: ["reorder"] },
  { query: "яблочный сок",    expectedIds: ["sk-1028"],            cat: "juice",     tags: ["reorder"] },
  { query: "греческий йогурт", expectedIds: ["3772"],              cat: "dairy",     tags: ["compound"] },
  { query: "йогурт греческий", expectedIds: ["3772"],              cat: "dairy",     tags: ["compound", "reorder"] },

  // compound / multi-word
  { query: "куриное филе",    expectedIds: ["7881"],               cat: "poultry",   tags: ["compound"] },
  { query: "филе индейки",    expectedIds: ["3586"],               cat: "poultry",   tags: ["compound"] },
  { query: "говяжий фарш",    expectedIds: ["sk-174"],             cat: "meat",      tags: ["compound"] },
  { query: "свиной фарш",     expectedIds: ["sk-181"],             cat: "meat",      tags: ["compound"] },
  { query: "хлеб белый",      expectedIds: ["20"],                 cat: "bakery",    tags: ["compound"] },
  { query: "хлеб чёрный",     expectedIds: ["20"],             cat: "bakery",    tags: ["compound", "yofication"] },
  { query: "хлеб ржаной",     expectedIds: ["20"],             cat: "bakery",    tags: ["compound"] },
  { query: "хлеб бородинский", expectedIds: ["20"],            cat: "bakery",    tags: ["compound"] },
  { query: "творог 5%",       expectedIds: ["sk-78"],              cat: "dairy",     tags: ["compound", "unit"] },
  { query: "творог обезжиренный", expectedIds: ["sk-78"],          cat: "dairy",     tags: ["compound"] },
  { query: "молоко 3.2",      expectedIds: ["sk-53"],              cat: "dairy",     tags: ["compound", "unit"] },
  { query: "молоко топлёное", expectedIds: ["sk-53"],              cat: "dairy",     tags: ["compound", "yofication"] },
  { query: "сок апельсиновый свежевыжатый", expectedIds: ["sk-1016"], cat: "juice",  tags: ["compound"] },
  { query: "чай с лимоном",   expectedIds: ["5715", "4405"],       cat: "beverage",  tags: ["compound"] },
  { query: "кофе с молоком",  expectedIds: ["4378"],               cat: "beverage",  tags: ["compound"] },
  { query: "кофе чёрный",     expectedIds: ["4378"],               cat: "beverage",  tags: ["compound", "yofication"] },

  // synonyms / alternate names
  { query: "кишмиш",          expectedIds: ["sk-900"],             cat: "fruit",     tags: ["synonym"] },
  { query: "курага сушёная",  expectedIds: ["sk-863"],             cat: "fruit",     tags: ["synonym", "yofication"] },
  { query: "помидоры черри",  expectedIds: ["sk-821"],             cat: "vegetable", tags: ["compound"] },

  // plural / case endings
  { query: "помидоры",        expectedIds: ["sk-821"],             cat: "vegetable", tags: ["plural"] },
  { query: "огурцы",          expectedIds: ["897"],                cat: "vegetable", tags: ["plural"] },
  { query: "яйца",            expectedIds: ["sk-164"],               cat: "egg",       tags: ["plural"] },
  { query: "яблоки",          expectedIds: ["sk-880"],             cat: "fruit",     tags: ["plural"] },
  { query: "бананы",          expectedIds: ["sk-898"],             cat: "fruit",     tags: ["plural"] },
  { query: "мандарины",       expectedIds: ["sk-896"],             cat: "fruit",     tags: ["plural"] },
  { query: "сосиски",         expectedIds: ["sk-331"],             cat: "meat",      tags: ["plural"] },
  { query: "креветки",        expectedIds: ["sk-495"],             cat: "seafood",   tags: ["plural"] },

  // grammatical cases (родительный, винительный — typical in voice)
  { query: "с бананом",       expectedIds: ["sk-898"],             cat: "fruit",     tags: ["case"] },
  { query: "с картошкой",     expectedIds: ["sk-746"],             cat: "vegetable", tags: ["case"] },
  { query: "с огурцом",       expectedIds: ["897"],                cat: "vegetable", tags: ["case"] },
  { query: "с сыром",         expectedIds: ["sk-145"],             cat: "dairy",     tags: ["case"] },
  { query: "без масла",       expectedIds: ["sk-510", "sk-532"],   cat: "oil",       tags: ["case"] },
  { query: "из творога",      expectedIds: ["sk-78"],              cat: "dairy",     tags: ["case"] },

  // preparation / state
  { query: "варёное яйцо",    expectedIds: ["sk-164"],               cat: "egg",       tags: ["compound", "yofication"] },
  { query: "варёная картошка", expectedIds: ["sk-746"],            cat: "vegetable", tags: ["compound", "yofication"] },
  { query: "жареная курица",  expectedIds: ["7881"],               cat: "poultry",   tags: ["compound"] },
  { query: "рис варёный",     expectedIds: ["sk-644"],             cat: "grain",     tags: ["compound", "yofication"] },
  { query: "варёная гречка",  expectedIds: ["2774"],               cat: "grain",     tags: ["compound", "yofication"] },
  { query: "тушёная капуста", expectedIds: ["sk-715"],             cat: "vegetable", tags: ["compound", "yofication"] },
];

// OOV: things NOT in the catalog. These must NOT produce a confident match.
const OOV: Case[] = [
  { query: "протеиновый батончик", expectedIds: [], cat: "oov" },
  { query: "смузи протеиновый",   expectedIds: [], cat: "oov" },
  { query: "сникерс",              expectedIds: [], cat: "oov" },
  { query: "марс батончик",        expectedIds: [], cat: "oov" },
  { query: "бигмак",               expectedIds: [], cat: "oov" },
  { query: "шаурма",               expectedIds: [], cat: "oov" },
  { query: "пицца пепперони",      expectedIds: [], cat: "oov" },
  { query: "роллы филадельфия",    expectedIds: [], cat: "oov" },
  { query: "хачапури",             expectedIds: [], cat: "oov" },
  { query: "манты",                expectedIds: [], cat: "oov" },
  { query: "плов",                 expectedIds: [], cat: "oov" },
];

// ─── Args / set selection ───

const argv = process.argv.slice(2);
const setArg = argv.find((a) => a.startsWith("--set="))?.split("=")[1] ?? "all";
const verbose = argv.includes("--verbose");

const sets: Record<string, Case[]> = { basic: BASIC, tricky: TRICKY, oov: OOV };
const cases: Case[] =
  setArg === "all"
    ? [...BASIC, ...TRICKY, ...OOV]
    : sets[setArg] ?? (() => { throw new Error(`Unknown --set=${setArg}`); })();

const MIN_RECALL_1 = 0.85;
const MIN_RECALL_3 = 0.95;
const OOV_CONFIDENCE_FLOOR = 0.85; // top-1 ≥ this on OOV is treated as a false positive
const MAX_OOV_FP_RATE = 0.30;

// ─── Probe ───

interface Probe {
  c: Case;
  top: Array<{ id: string; name: string; score: number }>;
  rank: number;  // 1-based, 0 = miss, -1 = OOV (scored separately)
}

async function probe(c: Case, k: number): Promise<Probe> {
  const top = await matchOne(c.query, k);
  const rank = c.expectedIds.length
    ? top.findIndex((t) => c.expectedIds.includes(t.id)) + 1
    : -1;
  return { c, top, rank };
}

const pad = (s: string, n: number) => (s.length >= n ? s : s + " ".repeat(n - s.length));

function summarizeScored(label: string, probes: Probe[]): { pass: boolean; r1: number; r3: number; mrr: number } {
  const scored = probes.filter((p) => p.c.expectedIds.length > 0);
  if (scored.length === 0) return { pass: true, r1: 1, r3: 1, mrr: 1 };

  const r1 = scored.filter((p) => p.rank === 1).length / scored.length;
  const r3 = scored.filter((p) => p.rank > 0).length / scored.length;
  const mrr = scored.reduce((s, p) => s + (p.rank > 0 ? 1 / p.rank : 0), 0) / scored.length;

  const r1Count = scored.filter((p) => p.rank === 1).length;
  const r3Count = scored.filter((p) => p.rank > 0).length;
  console.log(`${pad(label, 20)}  R@1: ${(r1 * 100).toFixed(1)}%  R@3: ${(r3 * 100).toFixed(1)}%  MRR: ${mrr.toFixed(3)}  (${r1Count}/${scored.length} top-1, ${r3Count}/${scored.length} top-3)`);

  const pass = r1 >= MIN_RECALL_1 && r3 >= MIN_RECALL_3;
  return { pass, r1, r3, mrr };
}

function summarizeOOV(probes: Probe[]): { pass: boolean; fpRate: number } {
  const oov = probes.filter((p) => p.c.expectedIds.length === 0);
  if (oov.length === 0) return { pass: true, fpRate: 0 };
  const fp = oov.filter((p) => p.top[0] && p.top[0].score >= OOV_CONFIDENCE_FLOOR).length;
  const fpRate = fp / oov.length;
  console.log(`${pad("OOV (no match)", 20)}  false-positive rate: ${(fpRate * 100).toFixed(1)}%  (${fp}/${oov.length} confidently matched something — should not)`);
  return { pass: fpRate <= MAX_OOV_FP_RATE, fpRate };
}

async function main() {
  await initMatcher();

  console.log(`\n=== Matcher probe (${cases.length} queries, set=${setArg}) ===\n`);
  const results: Probe[] = [];
  for (const c of cases) results.push(await probe(c, 3));

  // Per-case detail: show misses by default, all if --verbose
  for (const r of results) {
    const isOOV = r.c.expectedIds.length === 0;
    const mark = isOOV
      ? (r.top[0] && r.top[0].score >= OOV_CONFIDENCE_FLOOR ? "⚠" : "·")
      : r.rank === 1 ? "✓" : r.rank > 0 ? "~" : "✗";
    const show = verbose || (isOOV ? mark === "⚠" : r.rank !== 1);
    if (!show) continue;

    const t1 = r.top[0];
    const tags = r.c.tags ? ` [${r.c.tags.join(",")}]` : "";
    console.log(`${mark} ${pad(r.c.query, 26)} → ${t1?.score.toFixed(3) ?? "—"} [${pad(t1?.id ?? "—", 8)}] ${t1?.name ?? ""}${tags}`);
    if (!isOOV && r.rank !== 1) {
      for (const t of r.top.slice(1)) console.log(`     ${t.score.toFixed(3)} [${pad(t.id, 8)}] ${t.name}`);
      console.log(`     expected: ${r.c.expectedIds.join("|")}`);
    }
  }

  console.log("\n=== Summary ===\n");

  // Per-set breakdown
  const scored = results.filter((p) => p.c.expectedIds.length > 0);
  const overall = summarizeScored("OVERALL (scored)", scored);

  // Per-category
  const cats = Array.from(new Set(scored.map((p) => p.c.cat))).sort();
  console.log();
  console.log("Per-category:");
  for (const cat of cats) {
    summarizeScored(`  ${cat}`, scored.filter((p) => p.c.cat === cat));
  }

  // Per-tag (only in tricky)
  const tagged = scored.filter((p) => p.c.tags?.length);
  const tags = Array.from(new Set(tagged.flatMap((p) => p.c.tags ?? []))).sort();
  if (tags.length) {
    console.log();
    console.log("Per-phenomenon tag:");
    for (const tag of tags) {
      summarizeScored(`  ${tag}`, tagged.filter((p) => p.c.tags?.includes(tag)));
    }
  }

  // OOV
  console.log();
  const oov = summarizeOOV(results);

  const pass = overall.pass && oov.pass;
  console.log(`\nTargets:  R@1 ≥ ${MIN_RECALL_1}  R@3 ≥ ${MIN_RECALL_3}  OOV-FP ≤ ${MAX_OOV_FP_RATE}`);
  console.log(`Result:   ${pass ? "PASS ✓" : "FAIL ✗"}`);
  process.exit(pass ? 0 : 1);
}

await main();
