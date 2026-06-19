import type { SearchFilter } from './SearchFood';

// Split out of SearchFood.tsx so that file stays component-only (a stray const
// export breaks React Fast Refresh → full reload). The `SearchFilter` type is a
// type-only import, erased at build time — no runtime cycle.
export const FILTER_LABELS: Record<SearchFilter, string> = {
  all: 'Всё',
  mine: 'Мое',
};
