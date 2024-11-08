export function isEqual(value1: any, value2: any) {
    // Check if both are identical by reference
    if (value1 === value2) return true;

    // Check if either is null or not an object (primitive comparison)
    if (value1 == null || typeof value1 !== 'object' || value2 == null || typeof value2 !== 'object') {
        return false;
    }

    // Handle array comparison
    if (Array.isArray(value1) && Array.isArray(value2)) {
        if (value1.length !== value2.length) return false;
        return value1.every((item, index) => isEqual(item, value2[index]));
    }

    // Handle object comparison
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);
    if (keys1.length !== keys2.length) return false;

    // Recursively check each key-value pair
    return keys1.every(key => isEqual(value1[key], value2[key]));
}
