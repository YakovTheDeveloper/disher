export type Id = number
export type Value = number

export type IdMap<T> = Record<Id, T>

export type IdToQuantity = IdMap<number>

export type ISODate = string