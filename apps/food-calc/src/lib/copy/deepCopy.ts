export function deepCopy<T>(raw: T) {
    return JSON.parse(JSON.stringify(raw)) as T
}