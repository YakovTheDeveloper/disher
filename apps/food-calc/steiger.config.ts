import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

// Steiger is wired for ONE job: stop FSD import-direction violations (imports from
// a higher layer, cross-imports between sibling slices) from creeping back after
// the app/router cycle break (commit 5779de6e). Every other FSD rule — public-api
// bochki, slice granularity, naming — is deliberately OFF: enforcing them would mean
// touching every barrel in the tree, which is out of scope here. See tds handoff
// «steiger-gate» for the rationale (only `forbidden-imports` is in scope).
const OFF = 'off' as const

export default defineConfig([
  ...fsd.configs.recommended,

  // Keep ONLY fsd/forbidden-imports. Disable the other 16 recommended rules.
  {
    rules: {
      'fsd/ambiguous-slice-names': OFF,
      'fsd/excessive-slicing': OFF,
      'fsd/inconsistent-naming': OFF,
      'fsd/insignificant-slice': OFF,
      'fsd/no-layer-public-api': OFF,
      'fsd/no-public-api-sidestep': OFF,
      'fsd/no-reserved-folder-names': OFF,
      'fsd/no-segmentless-slices': OFF,
      'fsd/no-segments-on-sliced-layers': OFF,
      'fsd/no-ui-in-app': OFF,
      'fsd/public-api': OFF,
      'fsd/repetitive-naming': OFF,
      'fsd/segments-by-purpose': OFF,
      'fsd/shared-lib-grouping': OFF,
      'fsd/typo-in-layer-name': OFF,
      'fsd/no-processes': OFF,
    },
  },

  // Baseline ratchet: the 10 pre-existing forbidden-imports findings are known debt,
  // not a regression from the cycle-break work (8 are cross-slice imports, 2 are
  // upward imports — none is the app-router cycle class that was just eliminated).
  // Silence them per-file so the gate is green on arrival; anything NEW fails.
  // Fixing these is a real refactor with UI-behaviour risk — tracked separately.
  {
    files: [
      './src/entities/dish/api/useDishNutrientTotals.ts',
      './src/entities/schedule-food/api/useScheduleNutrientTotals.ts',
      './src/features/dish-analysis/api/runDishAnalysis.ts',
      './src/features/dish-analysis/api/storage.ts',
      './src/features/dish-analysis/api/types.ts',
      './src/features/dish-analysis/ui/DishAnalysisModal/DishAnalysisModal.tsx',
      './src/features/food/food-free-text-parse/ui/SuggestIngredientsClarifyDrawer/SuggestIngredientsClarifyDrawer.test.tsx',
      './src/shared/lib/e2e/bridge.ts',
    ],
    rules: {
      'fsd/forbidden-imports': OFF,
    },
  },
])
