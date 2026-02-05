const set = (key, value) =>
    sessionStorage.setItem(key, JSON.stringify(value));

const get = (key) => {
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
