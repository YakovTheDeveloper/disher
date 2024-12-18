export function addTokenToLocalStorage(token: string) {
    localStorage?.setItem('access_token', token)
}

export function getTokenFromLocalStorage() {
    if (typeof localStorage !== 'undefined') {
        return localStorage?.getItem('access_token');
    }
    return null;
}