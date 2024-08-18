function isEmptyBase(value: any): boolean {
    if (Array.isArray(value)) {
        return value.length === 0;
    } else if (value && typeof value === 'object' && value.constructor === Object) {
        return Object.keys(value).length === 0;
    }
    return false;
}

export function isEmpty(value: any): boolean {
    return isEmptyBase(value);
}

export function isNotEmpty(value: any): boolean {
    return !isEmptyBase(value);
}