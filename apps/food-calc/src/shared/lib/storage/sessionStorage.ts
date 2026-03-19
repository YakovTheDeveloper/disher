const set = (key: string, value: unknown) =>
    sessionStorage.setItem(key, JSON.stringify(value));

const get = (key: string) => {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
};

export const clearSessionStorage = (id?: string) => {
    if (id) {
        sessionStorage.removeItem(id);
    } else {
        sessionStorage.clear();
    }
}

export default { set, get, clearSessionStorage };
