export function addTokenToLocalStorage(token: string) {
    localStorage?.setItem('access_token', token)
}

export function getTokenFromLocalStorage() {
    if (typeof localStorage !== 'undefined') {
        return localStorage?.getItem('access_token');
    }
    return null;
}

export function removeTokenFromLocalStorage() {
    if (typeof localStorage !== 'undefined') {
        return localStorage?.removeItem('access_token');
    }
    return null;
}

export function persistToLocalStorage<T>(key: string, data: T) {
    localStorage.setItem(key, JSON.stringify(data));
}

export function loadFromLocalStorage<T>(key: string): T | null {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : null;
}