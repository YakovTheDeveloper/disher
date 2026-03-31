import type { DailyNormItems } from './types';

export const DEFAULT_NORM_ID = 'DEFAULT_NORM';

export const DEFAULT_NORM = {
  id: DEFAULT_NORM_ID,
  name: 'Стандарт',
  description: 'Стандартная норма потребления, для среднестатистического человека',
  userId: '__system__' as const,
  items: {
    '1': 70,     // Protein
    '2': 70,     // Fats
    '3': 300,    // Carbs
    '4': 50,     // Sugar
    '6': 25,     // Fiber
    '7': 2000,   // Energy
    '8': 2000,   // Water
    '9': 18,     // Iron
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
  } satisfies DailyNormItems,
};

export const SPORTS_NORM_ID = 'SPORTS_NORM';

export const SPORTS_NORM = {
  id: SPORTS_NORM_ID,
  name: 'Спортивная',
  description: 'Норма для физически активных людей и спортсменов',
  userId: '__system__' as const,
  items: {
    '1': 140,    // Protein 2g/kg
    '2': 85,     // Fats ~1.2g/kg
    '3': 400,    // Carbs ~5.7g/kg
    '4': 50,     // Sugar
    '6': 30,     // Fiber
    '7': 2800,   // Energy ~40kcal/kg
    '8': 2500,   // Water
    '9': 18,     // Iron
    '10': 450,   // Magnesium
    '11': 700,   // Phosphorus
    '12': 1200,  // Calcium
    '13': 4000,  // Potassium
    '14': 2300,  // Sodium
    '15': 15,    // Zinc
    '16': 900,   // Copper
    '17': 2300,  // Manganese
    '18': 70,    // Selenium
    '19': 150,   // Iodine
    '20': 900,   // Vitamin A
    '21': 1.5,   // B1
    '22': 1.6,   // B2
    '23': 20,    // B3
    '24': 550,   // B4
    '25': 7,     // B5
    '26': 2,     // B6
    '28': 400,   // B9
    '29': 2.4,   // B12
    '30': 120,   // C
    '31': 20,    // D
    '32': 15,    // E
    '33': 120,   // K
  } satisfies DailyNormItems,
};

export const BASE_WEIGHT_KG = 70;
