export function sumRecords<
    A extends Record<string, number>,
    B extends Record<string, number>
>(a: A, b: B): Record<string, number> {
    const result: Record<string, number> = { ...a };

    for (const key in b) {
        result[key] = (result[key] ?? 0) + b[key];
    }

    return result;
}

export function sumRecordArray<T extends Record<string, number>>(
    arr: T[]
): Record<string, number> {
    const result: Record<string, number> = {};

    for (const obj of arr) {
        for (const key in obj) {
            result[key] = (result[key] ?? 0) + obj[key];
        }
    }

    return result;
}
