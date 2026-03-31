import type { tables } from '@/livestore/schema'

type DailyNormRow = (typeof tables)['dailyNorms']['Type']

export type DailyNorm = DailyNormRow

/** Record<nutrientId, quantity> */
export type DailyNormItems = Record<string, number>;
