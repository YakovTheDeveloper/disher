export type WithoutId<T> = {
    [K in keyof T as K extends "id" ? never : K]:
    T[K] extends Array<infer U>
    ? WithoutId<U>[]
    : T[K] extends object
    ? WithoutId<T[K]>
    : T[K];
};