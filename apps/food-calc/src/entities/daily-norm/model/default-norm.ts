import type { DailyNormItems } from './types';

export const USER_NORM_ID = 'USER_NORM';
export const USER_NORM_NAME = 'Моя норма';

/**
 * Factory defaults applied when the user hasn't run the setup wizard yet.
 * Values are sex/age-neutral RDAs; the wizard overrides the relevant subset
 * (kcal/BJU/water/fiber + sex-driven micros).
 */
export const DEFAULT_NORM_ITEMS: DailyNormItems = {
  '1': 70,     // Protein
  '2': 70,     // Fats
  '3': 300,    // Carbs
  '4': 50,     // Sugar
  '6': 25,     // Fiber
  '7': 2000,   // Energy
  '8': 2000,   // Water
  '9': 18,     // Iron (female default; wizard adjusts by sex)
  '10': 400,   // Magnesium
  '11': 700,   // Phosphorus
  '12': 1000,  // Calcium
  '13': 3500,  // Potassium
  '14': 2300,  // Sodium
  '15': 11,    // Zinc
  '16': 900,   // Copper
  '17': 2300,  // Manganese
  '18': 55,    // Selenium
  '19': 150,   // Iodine
  '20': 900,   // Vitamin A
  '21': 1.2,   // B1
  '22': 1.3,   // B2
  '23': 16,    // B3
  '24': 550,   // B4
  '25': 5,     // B5
  '26': 1.3,   // B6
  '28': 400,   // B9
  '29': 2.4,   // B12
  '30': 90,    // C
  '31': 15,    // D
  '32': 15,    // E
  '33': 120,   // K
};
