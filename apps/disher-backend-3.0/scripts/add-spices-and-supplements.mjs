/**
 * Adds spices, culinary additives, and supplements to combined-foods.json.
 *
 * Nutrient data for spices/culinary items is hardcoded from USDA SR Legacy
 * (per 100g). Supplements have empty nutrients + dosage field.
 *
 * Usage: node scripts/add-spices-and-supplements.mjs
 *
 * Idempotent: removes previous custom entries before re-adding.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMBINED_PATH = resolve(__dirname, "../parser/output/combined-foods.json");

// ─── Nutrient data from USDA SR Legacy (per 100g) ───
// Project nutrient IDs: see triplit/constants/nutrients.ts
// Values from https://fdc.nal.usda.gov/

const SPICES_AND_CULINARY = [
  {
    nameRu: "Чёрный перец молотый",
    nameEng: "Spices, pepper, black",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 10.39 },  // protein g
      { nutrientId: "2", quantity: 3.26 },   // fat g
      { nutrientId: "3", quantity: 63.95 },  // carbs g
      { nutrientId: "4", quantity: 0.64 },   // sugar g
      { nutrientId: "6", quantity: 25.3 },   // fiber g
      { nutrientId: "7", quantity: 251 },    // kcal
      { nutrientId: "8", quantity: 12.46 },  // water g
      { nutrientId: "9", quantity: 9.71 },   // iron mg
      { nutrientId: "10", quantity: 171 },   // magnesium mg
      { nutrientId: "11", quantity: 158 },   // phosphorus mg
      { nutrientId: "12", quantity: 443 },   // calcium mg
      { nutrientId: "13", quantity: 1329 },  // potassium mg
      { nutrientId: "14", quantity: 20 },    // sodium mg
      { nutrientId: "15", quantity: 1.19 },  // zinc mg
      { nutrientId: "16", quantity: 1330 },  // copper μg
      { nutrientId: "17", quantity: 12753 }, // manganese μg
      { nutrientId: "18", quantity: 4.9 },   // selenium μg
      { nutrientId: "21", quantity: 0.108 }, // B1 mg
      { nutrientId: "22", quantity: 0.18 },  // B2 mg
      { nutrientId: "23", quantity: 1.143 }, // B3 mg
      { nutrientId: "26", quantity: 0.291 }, // B6 mg
      { nutrientId: "28", quantity: 17 },    // B9 μg
      { nutrientId: "20", quantity: 27 },    // vit A μg
      { nutrientId: "30", quantity: 0 },     // vit C mg
      { nutrientId: "32", quantity: 1.04 },  // vit E mg
      { nutrientId: "33", quantity: 163.7 }, // vit K μg
      { nutrientId: "34", quantity: 310 },   // beta-carotene μg
    ],
  },
  {
    nameRu: "Куркума молотая",
    nameEng: "Spices, turmeric, ground",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 7.83 },
      { nutrientId: "2", quantity: 9.88 },
      { nutrientId: "3", quantity: 64.93 },
      { nutrientId: "4", quantity: 3.21 },
      { nutrientId: "6", quantity: 21.1 },
      { nutrientId: "7", quantity: 354 },
      { nutrientId: "8", quantity: 11.36 },
      { nutrientId: "9", quantity: 41.42 },
      { nutrientId: "10", quantity: 193 },
      { nutrientId: "11", quantity: 268 },
      { nutrientId: "12", quantity: 183 },
      { nutrientId: "13", quantity: 2525 },
      { nutrientId: "14", quantity: 38 },
      { nutrientId: "15", quantity: 4.35 },
      { nutrientId: "16", quantity: 603 },
      { nutrientId: "17", quantity: 7833 },
      { nutrientId: "18", quantity: 6.2 },
      { nutrientId: "21", quantity: 0.152 },
      { nutrientId: "22", quantity: 0.233 },
      { nutrientId: "23", quantity: 5.14 },
      { nutrientId: "26", quantity: 1.8 },
      { nutrientId: "28", quantity: 39 },
      { nutrientId: "30", quantity: 25.9 },
      { nutrientId: "32", quantity: 3.1 },
      { nutrientId: "33", quantity: 13.4 },
    ],
  },
  {
    nameRu: "Корица молотая",
    nameEng: "Spices, cinnamon, ground",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 3.99 },
      { nutrientId: "2", quantity: 1.24 },
      { nutrientId: "3", quantity: 80.59 },
      { nutrientId: "4", quantity: 2.17 },
      { nutrientId: "6", quantity: 53.1 },
      { nutrientId: "7", quantity: 247 },
      { nutrientId: "8", quantity: 10.58 },
      { nutrientId: "9", quantity: 8.32 },
      { nutrientId: "10", quantity: 60 },
      { nutrientId: "11", quantity: 64 },
      { nutrientId: "12", quantity: 1002 },
      { nutrientId: "13", quantity: 431 },
      { nutrientId: "14", quantity: 10 },
      { nutrientId: "15", quantity: 1.83 },
      { nutrientId: "16", quantity: 339 },
      { nutrientId: "17", quantity: 17466 },
      { nutrientId: "18", quantity: 3.1 },
      { nutrientId: "21", quantity: 0.022 },
      { nutrientId: "22", quantity: 0.041 },
      { nutrientId: "23", quantity: 1.332 },
      { nutrientId: "26", quantity: 0.158 },
      { nutrientId: "28", quantity: 6 },
      { nutrientId: "20", quantity: 15 },
      { nutrientId: "30", quantity: 3.8 },
      { nutrientId: "32", quantity: 2.32 },
      { nutrientId: "33", quantity: 31.2 },
    ],
  },
  {
    nameRu: "Имбирь молотый",
    nameEng: "Spices, ginger, ground",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 8.98 },
      { nutrientId: "2", quantity: 4.24 },
      { nutrientId: "3", quantity: 71.62 },
      { nutrientId: "4", quantity: 3.39 },
      { nutrientId: "6", quantity: 14.1 },
      { nutrientId: "7", quantity: 335 },
      { nutrientId: "8", quantity: 9.94 },
      { nutrientId: "9", quantity: 11.52 },
      { nutrientId: "10", quantity: 214 },
      { nutrientId: "11", quantity: 168 },
      { nutrientId: "12", quantity: 114 },
      { nutrientId: "13", quantity: 1320 },
      { nutrientId: "14", quantity: 27 },
      { nutrientId: "15", quantity: 3.64 },
      { nutrientId: "16", quantity: 480 },
      { nutrientId: "17", quantity: 33300 },
      { nutrientId: "18", quantity: 55.8 },
      { nutrientId: "21", quantity: 0.046 },
      { nutrientId: "22", quantity: 0.185 },
      { nutrientId: "23", quantity: 5.155 },
      { nutrientId: "26", quantity: 0.626 },
      { nutrientId: "28", quantity: 13 },
      { nutrientId: "30", quantity: 0.7 },
      { nutrientId: "32", quantity: 0 },
    ],
  },
  {
    nameRu: "Имбирь свежий",
    nameEng: "Ginger root, raw",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 1.82 },
      { nutrientId: "2", quantity: 0.75 },
      { nutrientId: "3", quantity: 17.77 },
      { nutrientId: "4", quantity: 1.7 },
      { nutrientId: "6", quantity: 2 },
      { nutrientId: "7", quantity: 80 },
      { nutrientId: "8", quantity: 78.89 },
      { nutrientId: "9", quantity: 0.6 },
      { nutrientId: "10", quantity: 43 },
      { nutrientId: "11", quantity: 34 },
      { nutrientId: "12", quantity: 16 },
      { nutrientId: "13", quantity: 415 },
      { nutrientId: "14", quantity: 13 },
      { nutrientId: "15", quantity: 0.34 },
      { nutrientId: "16", quantity: 226 },
      { nutrientId: "17", quantity: 229 },
      { nutrientId: "18", quantity: 0.7 },
      { nutrientId: "21", quantity: 0.025 },
      { nutrientId: "22", quantity: 0.034 },
      { nutrientId: "23", quantity: 0.75 },
      { nutrientId: "25", quantity: 0.203 },
      { nutrientId: "26", quantity: 0.16 },
      { nutrientId: "28", quantity: 11 },
      { nutrientId: "30", quantity: 5 },
      { nutrientId: "32", quantity: 0.26 },
      { nutrientId: "33", quantity: 0.1 },
    ],
  },
  {
    nameRu: "Паприка молотая",
    nameEng: "Spices, paprika",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 14.14 },
      { nutrientId: "2", quantity: 12.89 },
      { nutrientId: "3", quantity: 53.99 },
      { nutrientId: "4", quantity: 10.34 },
      { nutrientId: "6", quantity: 34.9 },
      { nutrientId: "7", quantity: 282 },
      { nutrientId: "8", quantity: 11.24 },
      { nutrientId: "9", quantity: 21.14 },
      { nutrientId: "10", quantity: 178 },
      { nutrientId: "11", quantity: 314 },
      { nutrientId: "12", quantity: 229 },
      { nutrientId: "13", quantity: 2280 },
      { nutrientId: "14", quantity: 68 },
      { nutrientId: "15", quantity: 4.33 },
      { nutrientId: "16", quantity: 713 },
      { nutrientId: "17", quantity: 1590 },
      { nutrientId: "18", quantity: 6.3 },
      { nutrientId: "21", quantity: 0.33 },
      { nutrientId: "22", quantity: 1.23 },
      { nutrientId: "23", quantity: 10.06 },
      { nutrientId: "26", quantity: 2.141 },
      { nutrientId: "28", quantity: 49 },
      { nutrientId: "20", quantity: 2463 },
      { nutrientId: "30", quantity: 0.9 },
      { nutrientId: "32", quantity: 29.83 },
      { nutrientId: "33", quantity: 80.3 },
      { nutrientId: "34", quantity: 26162 },
    ],
  },
  {
    nameRu: "Кориандр молотый (семена)",
    nameEng: "Spices, coriander seed",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 12.37 },
      { nutrientId: "2", quantity: 17.77 },
      { nutrientId: "3", quantity: 54.99 },
      { nutrientId: "6", quantity: 41.9 },
      { nutrientId: "7", quantity: 298 },
      { nutrientId: "8", quantity: 8.86 },
      { nutrientId: "9", quantity: 16.32 },
      { nutrientId: "10", quantity: 330 },
      { nutrientId: "11", quantity: 409 },
      { nutrientId: "12", quantity: 709 },
      { nutrientId: "13", quantity: 1267 },
      { nutrientId: "14", quantity: 35 },
      { nutrientId: "15", quantity: 4.7 },
      { nutrientId: "16", quantity: 975 },
      { nutrientId: "17", quantity: 1900 },
      { nutrientId: "18", quantity: 26.2 },
      { nutrientId: "21", quantity: 0.239 },
      { nutrientId: "22", quantity: 0.29 },
      { nutrientId: "23", quantity: 2.13 },
      { nutrientId: "30", quantity: 21 },
    ],
  },
  {
    nameRu: "Тмин (зира)",
    nameEng: "Spices, cumin seed",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 17.81 },
      { nutrientId: "2", quantity: 22.27 },
      { nutrientId: "3", quantity: 44.24 },
      { nutrientId: "4", quantity: 2.25 },
      { nutrientId: "6", quantity: 10.5 },
      { nutrientId: "7", quantity: 375 },
      { nutrientId: "8", quantity: 8.06 },
      { nutrientId: "9", quantity: 66.36 },
      { nutrientId: "10", quantity: 366 },
      { nutrientId: "11", quantity: 499 },
      { nutrientId: "12", quantity: 931 },
      { nutrientId: "13", quantity: 1788 },
      { nutrientId: "14", quantity: 168 },
      { nutrientId: "15", quantity: 4.8 },
      { nutrientId: "16", quantity: 867 },
      { nutrientId: "17", quantity: 3333 },
      { nutrientId: "18", quantity: 5.2 },
      { nutrientId: "21", quantity: 0.628 },
      { nutrientId: "22", quantity: 0.327 },
      { nutrientId: "23", quantity: 4.579 },
      { nutrientId: "26", quantity: 0.435 },
      { nutrientId: "28", quantity: 10 },
      { nutrientId: "20", quantity: 64 },
      { nutrientId: "30", quantity: 7.7 },
      { nutrientId: "32", quantity: 3.33 },
      { nutrientId: "33", quantity: 5.4 },
    ],
  },
  {
    nameRu: "Гвоздика молотая",
    nameEng: "Spices, cloves, ground",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 5.97 },
      { nutrientId: "2", quantity: 13 },
      { nutrientId: "3", quantity: 65.53 },
      { nutrientId: "4", quantity: 2.38 },
      { nutrientId: "6", quantity: 33.9 },
      { nutrientId: "7", quantity: 274 },
      { nutrientId: "8", quantity: 9.87 },
      { nutrientId: "9", quantity: 11.83 },
      { nutrientId: "10", quantity: 259 },
      { nutrientId: "11", quantity: 104 },
      { nutrientId: "12", quantity: 632 },
      { nutrientId: "13", quantity: 1020 },
      { nutrientId: "14", quantity: 277 },
      { nutrientId: "15", quantity: 2.32 },
      { nutrientId: "16", quantity: 368 },
      { nutrientId: "17", quantity: 60127 },
      { nutrientId: "18", quantity: 7.2 },
      { nutrientId: "21", quantity: 0.158 },
      { nutrientId: "22", quantity: 0.22 },
      { nutrientId: "23", quantity: 1.56 },
      { nutrientId: "26", quantity: 0.391 },
      { nutrientId: "28", quantity: 25 },
      { nutrientId: "20", quantity: 8 },
      { nutrientId: "30", quantity: 0.2 },
      { nutrientId: "32", quantity: 8.82 },
      { nutrientId: "33", quantity: 141.8 },
    ],
  },
  {
    nameRu: "Мускатный орех молотый",
    nameEng: "Spices, nutmeg, ground",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 5.84 },
      { nutrientId: "2", quantity: 36.31 },
      { nutrientId: "3", quantity: 49.29 },
      { nutrientId: "4", quantity: 2.99 },
      { nutrientId: "6", quantity: 20.8 },
      { nutrientId: "7", quantity: 525 },
      { nutrientId: "8", quantity: 6.23 },
      { nutrientId: "9", quantity: 3.04 },
      { nutrientId: "10", quantity: 183 },
      { nutrientId: "11", quantity: 213 },
      { nutrientId: "12", quantity: 184 },
      { nutrientId: "13", quantity: 350 },
      { nutrientId: "14", quantity: 16 },
      { nutrientId: "15", quantity: 2.15 },
      { nutrientId: "16", quantity: 1027 },
      { nutrientId: "17", quantity: 2900 },
      { nutrientId: "18", quantity: 1.6 },
      { nutrientId: "21", quantity: 0.346 },
      { nutrientId: "22", quantity: 0.057 },
      { nutrientId: "23", quantity: 1.299 },
      { nutrientId: "26", quantity: 0.16 },
      { nutrientId: "28", quantity: 76 },
      { nutrientId: "20", quantity: 5 },
      { nutrientId: "30", quantity: 3 },
    ],
  },
  {
    nameRu: "Лавровый лист",
    nameEng: "Spices, bay leaf",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 7.61 },
      { nutrientId: "2", quantity: 8.36 },
      { nutrientId: "3", quantity: 74.97 },
      { nutrientId: "6", quantity: 26.3 },
      { nutrientId: "7", quantity: 313 },
      { nutrientId: "8", quantity: 5.44 },
      { nutrientId: "9", quantity: 43 },
      { nutrientId: "10", quantity: 120 },
      { nutrientId: "11", quantity: 113 },
      { nutrientId: "12", quantity: 834 },
      { nutrientId: "13", quantity: 529 },
      { nutrientId: "14", quantity: 23 },
      { nutrientId: "15", quantity: 3.7 },
      { nutrientId: "16", quantity: 416 },
      { nutrientId: "17", quantity: 8167 },
      { nutrientId: "18", quantity: 2.8 },
      { nutrientId: "21", quantity: 0.009 },
      { nutrientId: "22", quantity: 0.421 },
      { nutrientId: "23", quantity: 2.005 },
      { nutrientId: "26", quantity: 1.74 },
      { nutrientId: "28", quantity: 180 },
      { nutrientId: "20", quantity: 309 },
      { nutrientId: "30", quantity: 46.5 },
      { nutrientId: "34", quantity: 3700 },
    ],
  },
  {
    nameRu: "Укроп сушёный",
    nameEng: "Spices, dill weed, dried",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 19.96 },
      { nutrientId: "2", quantity: 4.36 },
      { nutrientId: "3", quantity: 55.82 },
      { nutrientId: "6", quantity: 13.6 },
      { nutrientId: "7", quantity: 253 },
      { nutrientId: "8", quantity: 7.3 },
      { nutrientId: "9", quantity: 48.78 },
      { nutrientId: "10", quantity: 451 },
      { nutrientId: "11", quantity: 543 },
      { nutrientId: "12", quantity: 1784 },
      { nutrientId: "13", quantity: 3308 },
      { nutrientId: "14", quantity: 208 },
      { nutrientId: "15", quantity: 3.3 },
      { nutrientId: "21", quantity: 0.418 },
      { nutrientId: "22", quantity: 0.284 },
      { nutrientId: "23", quantity: 2.807 },
      { nutrientId: "26", quantity: 1.71 },
      { nutrientId: "20", quantity: 293 },
      { nutrientId: "30", quantity: 50 },
    ],
  },
  {
    nameRu: "Петрушка сушёная",
    nameEng: "Spices, parsley, dried",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 26.63 },
      { nutrientId: "2", quantity: 5.48 },
      { nutrientId: "3", quantity: 50.64 },
      { nutrientId: "6", quantity: 26.7 },
      { nutrientId: "7", quantity: 292 },
      { nutrientId: "8", quantity: 5.89 },
      { nutrientId: "9", quantity: 22.04 },
      { nutrientId: "10", quantity: 400 },
      { nutrientId: "11", quantity: 436 },
      { nutrientId: "12", quantity: 1140 },
      { nutrientId: "13", quantity: 2683 },
      { nutrientId: "14", quantity: 452 },
      { nutrientId: "15", quantity: 5.44 },
      { nutrientId: "16", quantity: 780 },
      { nutrientId: "17", quantity: 9810 },
      { nutrientId: "18", quantity: 14.1 },
      { nutrientId: "21", quantity: 0.196 },
      { nutrientId: "22", quantity: 1.23 },
      { nutrientId: "23", quantity: 9.943 },
      { nutrientId: "26", quantity: 0.9 },
      { nutrientId: "28", quantity: 180 },
      { nutrientId: "29", quantity: 0 },
      { nutrientId: "20", quantity: 303 },
      { nutrientId: "30", quantity: 125 },
      { nutrientId: "32", quantity: 8.96 },
      { nutrientId: "33", quantity: 1359.5 },
    ],
  },
  {
    nameRu: "Базилик сушёный",
    nameEng: "Spices, basil, dried",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 22.98 },
      { nutrientId: "2", quantity: 4.07 },
      { nutrientId: "3", quantity: 47.75 },
      { nutrientId: "4", quantity: 1.71 },
      { nutrientId: "6", quantity: 37.7 },
      { nutrientId: "7", quantity: 233 },
      { nutrientId: "8", quantity: 10.35 },
      { nutrientId: "9", quantity: 89.8 },
      { nutrientId: "10", quantity: 711 },
      { nutrientId: "11", quantity: 274 },
      { nutrientId: "12", quantity: 2240 },
      { nutrientId: "13", quantity: 2630 },
      { nutrientId: "14", quantity: 76 },
      { nutrientId: "15", quantity: 7.1 },
      { nutrientId: "16", quantity: 2100 },
      { nutrientId: "17", quantity: 9800 },
      { nutrientId: "18", quantity: 3 },
      { nutrientId: "21", quantity: 0.148 },
      { nutrientId: "22", quantity: 1.2 },
      { nutrientId: "23", quantity: 4.9 },
      { nutrientId: "26", quantity: 1.34 },
      { nutrientId: "28", quantity: 310 },
      { nutrientId: "20", quantity: 744 },
      { nutrientId: "30", quantity: 0.8 },
      { nutrientId: "32", quantity: 10.7 },
      { nutrientId: "33", quantity: 1714.5 },
    ],
  },
  {
    nameRu: "Орегано сушёный",
    nameEng: "Spices, oregano, dried",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 9 },
      { nutrientId: "2", quantity: 4.28 },
      { nutrientId: "3", quantity: 68.92 },
      { nutrientId: "4", quantity: 4.09 },
      { nutrientId: "6", quantity: 42.5 },
      { nutrientId: "7", quantity: 265 },
      { nutrientId: "8", quantity: 9.93 },
      { nutrientId: "9", quantity: 36.8 },
      { nutrientId: "10", quantity: 270 },
      { nutrientId: "11", quantity: 148 },
      { nutrientId: "12", quantity: 1597 },
      { nutrientId: "13", quantity: 1260 },
      { nutrientId: "14", quantity: 25 },
      { nutrientId: "15", quantity: 2.69 },
      { nutrientId: "16", quantity: 633 },
      { nutrientId: "17", quantity: 4990 },
      { nutrientId: "18", quantity: 4.5 },
      { nutrientId: "21", quantity: 0.177 },
      { nutrientId: "22", quantity: 0.528 },
      { nutrientId: "23", quantity: 4.64 },
      { nutrientId: "26", quantity: 1.044 },
      { nutrientId: "28", quantity: 237 },
      { nutrientId: "20", quantity: 85 },
      { nutrientId: "30", quantity: 2.3 },
      { nutrientId: "32", quantity: 18.26 },
      { nutrientId: "33", quantity: 621.7 },
      { nutrientId: "34", quantity: 1007 },
    ],
  },
  {
    nameRu: "Чеснок сушёный (порошок)",
    nameEng: "Spices, garlic powder",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 16.55 },
      { nutrientId: "2", quantity: 0.73 },
      { nutrientId: "3", quantity: 72.73 },
      { nutrientId: "4", quantity: 2.43 },
      { nutrientId: "6", quantity: 9 },
      { nutrientId: "7", quantity: 331 },
      { nutrientId: "8", quantity: 6.45 },
      { nutrientId: "9", quantity: 5.65 },
      { nutrientId: "10", quantity: 77 },
      { nutrientId: "11", quantity: 414 },
      { nutrientId: "12", quantity: 79 },
      { nutrientId: "13", quantity: 1193 },
      { nutrientId: "14", quantity: 60 },
      { nutrientId: "15", quantity: 2.99 },
      { nutrientId: "16", quantity: 530 },
      { nutrientId: "17", quantity: 1672 },
      { nutrientId: "18", quantity: 23.9 },
      { nutrientId: "21", quantity: 0.435 },
      { nutrientId: "22", quantity: 0.141 },
      { nutrientId: "23", quantity: 0.796 },
      { nutrientId: "26", quantity: 1.235 },
      { nutrientId: "28", quantity: 4.8 },
      { nutrientId: "30", quantity: 1.2 },
      { nutrientId: "32", quantity: 0.67 },
    ],
  },
  // ─── Culinary additives ───
  {
    nameRu: "Сода пищевая",
    nameEng: "Leavening agents, baking soda",
    category: "other",
    nutrients: [
      { nutrientId: "7", quantity: 0 },
      { nutrientId: "14", quantity: 27360 },  // sodium mg — very high
    ],
  },
  {
    nameRu: "Дрожжи сухие активные",
    nameEng: "Yeast, baker's, active dry",
    category: "other",
    nutrients: [
      { nutrientId: "1", quantity: 40.44 },
      { nutrientId: "2", quantity: 7.61 },
      { nutrientId: "3", quantity: 41.22 },
      { nutrientId: "4", quantity: 0 },
      { nutrientId: "6", quantity: 26.9 },
      { nutrientId: "7", quantity: 325 },
      { nutrientId: "8", quantity: 5.08 },
      { nutrientId: "9", quantity: 2.17 },
      { nutrientId: "10", quantity: 54 },
      { nutrientId: "11", quantity: 637 },
      { nutrientId: "12", quantity: 30 },
      { nutrientId: "13", quantity: 955 },
      { nutrientId: "14", quantity: 51 },
      { nutrientId: "15", quantity: 7.94 },
      { nutrientId: "16", quantity: 440 },
      { nutrientId: "17", quantity: 314 },
      { nutrientId: "18", quantity: 7.9 },
      { nutrientId: "21", quantity: 2.26 },
      { nutrientId: "22", quantity: 4 },
      { nutrientId: "23", quantity: 40.2 },
      { nutrientId: "25", quantity: 13.5 },
      { nutrientId: "26", quantity: 1.5 },
      { nutrientId: "28", quantity: 2340 },
      { nutrientId: "29", quantity: 0.02 },
    ],
  },
  {
    nameRu: "Желатин",
    nameEng: "Gelatin, dry powder, unsweetened",
    category: "other",
    nutrients: [
      { nutrientId: "1", quantity: 85.6 },
      { nutrientId: "2", quantity: 0.1 },
      { nutrientId: "3", quantity: 0 },
      { nutrientId: "7", quantity: 335 },
      { nutrientId: "8", quantity: 13 },
      { nutrientId: "9", quantity: 0.5 },
      { nutrientId: "11", quantity: 15 },
      { nutrientId: "12", quantity: 10 },
      { nutrientId: "13", quantity: 22 },
      { nutrientId: "14", quantity: 196 },
      { nutrientId: "15", quantity: 0.06 },
      { nutrientId: "16", quantity: 230 },
      { nutrientId: "18", quantity: 16.2 },
    ],
  },
  {
    nameRu: "Крахмал картофельный",
    nameEng: "Starch, potato",
    category: "other",
    nutrients: [
      { nutrientId: "1", quantity: 0.06 },
      { nutrientId: "2", quantity: 0.04 },
      { nutrientId: "3", quantity: 83.1 },
      { nutrientId: "5", quantity: 83.1 },
      { nutrientId: "7", quantity: 333 },
      { nutrientId: "8", quantity: 16.62 },
      { nutrientId: "11", quantity: 24 },
      { nutrientId: "12", quantity: 15 },
      { nutrientId: "13", quantity: 11 },
      { nutrientId: "14", quantity: 4 },
    ],
  },
  {
    nameRu: "Крахмал кукурузный",
    nameEng: "Starch, corn",
    category: "other",
    nutrients: [
      { nutrientId: "1", quantity: 0.26 },
      { nutrientId: "2", quantity: 0.05 },
      { nutrientId: "3", quantity: 91.27 },
      { nutrientId: "5", quantity: 91.27 },
      { nutrientId: "6", quantity: 0.9 },
      { nutrientId: "7", quantity: 381 },
      { nutrientId: "8", quantity: 8.32 },
      { nutrientId: "9", quantity: 0.47 },
      { nutrientId: "10", quantity: 3 },
      { nutrientId: "11", quantity: 13 },
      { nutrientId: "12", quantity: 2 },
      { nutrientId: "13", quantity: 3 },
      { nutrientId: "14", quantity: 9 },
      { nutrientId: "15", quantity: 0.06 },
      { nutrientId: "16", quantity: 53 },
      { nutrientId: "17", quantity: 53 },
      { nutrientId: "18", quantity: 3.6 },
    ],
  },
  {
    nameRu: "Разрыхлитель теста",
    nameEng: "Leavening agents, baking powder, double-acting",
    category: "other",
    nutrients: [
      { nutrientId: "7", quantity: 53 },
      { nutrientId: "3", quantity: 27.7 },
      { nutrientId: "12", quantity: 5876 },
      { nutrientId: "11", quantity: 2191 },
      { nutrientId: "14", quantity: 10600 },
    ],
  },
  {
    nameRu: "Ванильный экстракт",
    nameEng: "Vanilla extract",
    category: "spice",
    nutrients: [
      { nutrientId: "1", quantity: 0.06 },
      { nutrientId: "2", quantity: 0.06 },
      { nutrientId: "3", quantity: 12.65 },
      { nutrientId: "4", quantity: 12.65 },
      { nutrientId: "7", quantity: 288 },
      { nutrientId: "8", quantity: 52.58 },
      { nutrientId: "10", quantity: 12 },
      { nutrientId: "11", quantity: 6 },
      { nutrientId: "12", quantity: 11 },
      { nutrientId: "13", quantity: 148 },
      { nutrientId: "14", quantity: 9 },
      { nutrientId: "15", quantity: 0.11 },
      { nutrientId: "16", quantity: 72 },
      { nutrientId: "17", quantity: 230 },
      { nutrientId: "22", quantity: 0.095 },
      { nutrientId: "23", quantity: 0.425 },
      { nutrientId: "25", quantity: 0.035 },
      { nutrientId: "26", quantity: 0.026 },
    ],
  },
  {
    nameRu: "Агар-агар",
    nameEng: "Agar, raw",
    category: "other",
    nutrients: [
      { nutrientId: "1", quantity: 0.54 },
      { nutrientId: "2", quantity: 0.03 },
      { nutrientId: "3", quantity: 6.75 },
      { nutrientId: "6", quantity: 0.5 },
      { nutrientId: "7", quantity: 26 },
      { nutrientId: "8", quantity: 91.32 },
      { nutrientId: "9", quantity: 1.86 },
      { nutrientId: "10", quantity: 67 },
      { nutrientId: "12", quantity: 54 },
      { nutrientId: "13", quantity: 226 },
      { nutrientId: "14", quantity: 9 },
      { nutrientId: "15", quantity: 0.58 },
      { nutrientId: "16", quantity: 60 },
      { nutrientId: "17", quantity: 400 },
      { nutrientId: "18", quantity: 0.7 },
      { nutrientId: "28", quantity: 58 },
    ],
  },
  // No USDA data
  {
    nameRu: "Хмели-сунели",
    nameEng: "Khmeli-suneli (Georgian spice mix)",
    category: "spice",
    nutrients: [],
  },
  {
    nameRu: "Лимонная кислота",
    nameEng: "Citric acid",
    category: "other",
    nutrients: [],
  },
];

// ─── Supplements (БАДы) ───

const SUPPLEMENTS = [
  // Vitamins
  { nameRu: "Витамин D3",              nameEng: "Vitamin D3 supplement",              dosage: { unit: "IU",  defaultAmount: 2000 } },
  { nameRu: "Витамин C",               nameEng: "Vitamin C supplement",               dosage: { unit: "mg",  defaultAmount: 500 } },
  { nameRu: "Витамин B12",             nameEng: "Vitamin B12 supplement",             dosage: { unit: "mcg", defaultAmount: 1000 } },
  { nameRu: "Фолиевая кислота (B9)",   nameEng: "Folic acid (B9) supplement",         dosage: { unit: "mcg", defaultAmount: 400 } },
  { nameRu: "Витамин A",               nameEng: "Vitamin A supplement",               dosage: { unit: "IU",  defaultAmount: 5000 } },
  { nameRu: "Витамин E",               nameEng: "Vitamin E supplement",               dosage: { unit: "IU",  defaultAmount: 400 } },
  { nameRu: "Витамин K2",              nameEng: "Vitamin K2 supplement",              dosage: { unit: "mcg", defaultAmount: 100 } },
  // Minerals
  { nameRu: "Железо (добавка)",         nameEng: "Iron supplement",                    dosage: { unit: "mg",  defaultAmount: 25 } },
  { nameRu: "Магний (добавка)",          nameEng: "Magnesium supplement",               dosage: { unit: "mg",  defaultAmount: 400 } },
  { nameRu: "Кальций (добавка)",         nameEng: "Calcium supplement",                 dosage: { unit: "mg",  defaultAmount: 500 } },
  { nameRu: "Цинк (добавка)",           nameEng: "Zinc supplement",                    dosage: { unit: "mg",  defaultAmount: 15 } },
  { nameRu: "Йод (добавка)",            nameEng: "Iodine supplement",                  dosage: { unit: "mcg", defaultAmount: 150 } },
  { nameRu: "Селен (добавка)",          nameEng: "Selenium supplement",                dosage: { unit: "mcg", defaultAmount: 100 } },
  { nameRu: "Калий (добавка)",          nameEng: "Potassium supplement",               dosage: { unit: "mg",  defaultAmount: 99 } },
  // Popular supplements
  { nameRu: "Омега-3 (рыбий жир)",     nameEng: "Omega-3 fish oil supplement",         dosage: { unit: "mg",  defaultAmount: 1000 } },
  { nameRu: "Мультивитамины",           nameEng: "Multivitamin supplement",             dosage: { unit: "шт", defaultAmount: 1 } },
  { nameRu: "Пробиотик",               nameEng: "Probiotic supplement",                dosage: { unit: "шт", defaultAmount: 1 } },
  { nameRu: "Коллаген",                nameEng: "Collagen supplement",                 dosage: { unit: "g",   defaultAmount: 10 } },
  { nameRu: "Креатин",                 nameEng: "Creatine supplement",                 dosage: { unit: "g",   defaultAmount: 5 } },
  { nameRu: "Протеин сывороточный",    nameEng: "Whey protein supplement",             dosage: { unit: "g",   defaultAmount: 30 } },
  { nameRu: "L-карнитин",              nameEng: "L-carnitine supplement",               dosage: { unit: "mg",  defaultAmount: 500 } },
  { nameRu: "Мелатонин",               nameEng: "Melatonin supplement",                dosage: { unit: "mg",  defaultAmount: 3 } },
  { nameRu: "Глицин",                  nameEng: "Glycine supplement",                  dosage: { unit: "mg",  defaultAmount: 1000 } },
  { nameRu: "Валериана",               nameEng: "Valerian root supplement",             dosage: { unit: "mg",  defaultAmount: 450 } },
];

// ─── Main ───

function main() {
  console.log("=== Add spices, culinary additives & supplements ===\n");

  const db = JSON.parse(readFileSync(COMBINED_PATH, "utf-8"));

  // Remove previous custom entries (idempotent)
  const beforeCount = db.foods.length;
  db.foods = db.foods.filter(
    (f) => f.source !== "custom" && f.source !== "usda-custom"
  );
  const removed = beforeCount - db.foods.length;
  if (removed > 0) {
    console.log(`Removed ${removed} previous custom entries.\n`);
  }

  const existingIds = new Set(db.foods.map((f) => f.id));
  let counter = 1;

  function nextId() {
    while (existingIds.has(`custom-${counter}`)) counter++;
    const id = `custom-${counter}`;
    existingIds.add(id);
    counter++;
    return id;
  }

  // 1. Add spices & culinary items
  console.log("Adding spices & culinary items...");
  for (const item of SPICES_AND_CULINARY) {
    db.foods.push({
      id: nextId(),
      nameEng: item.nameEng,
      nameRu: item.nameRu,
      source: "custom",
      categories: [item.category],
      nutrients: item.nutrients,
      portions: [],
    });
    const nutrientCount = item.nutrients.length;
    console.log(
      `  + ${item.nameRu} (${nutrientCount} nutrients)`
    );
  }

  // 2. Add supplements
  console.log("\nAdding supplements (БАДы)...");
  for (const item of SUPPLEMENTS) {
    db.foods.push({
      id: nextId(),
      nameEng: item.nameEng,
      nameRu: item.nameRu,
      source: "custom",
      categories: ["supplement"],
      nutrients: [],
      portions: [],
      dosage: item.dosage,
    });
    console.log(
      `  + ${item.nameRu} (${item.dosage.defaultAmount} ${item.dosage.unit})`
    );
  }

  // 3. Update metadata and save
  db.meta.totalFoods = db.foods.length;
  db.meta.lastCustomAddition = new Date().toISOString();

  writeFileSync(COMBINED_PATH, JSON.stringify(db, null, 2), "utf-8");

  console.log(`\n--- Summary ---`);
  console.log(`Spices & culinary: ${SPICES_AND_CULINARY.length}`);
  console.log(`Supplements: ${SUPPLEMENTS.length}`);
  console.log(`Total new: ${SPICES_AND_CULINARY.length + SUPPLEMENTS.length}`);
  console.log(`Total foods now: ${db.foods.length}`);
  console.log("\n✓ combined-foods.json updated successfully!");
}

main();
