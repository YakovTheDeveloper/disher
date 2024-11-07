export function addTokenToLocalStorage(token: string) {
    localStorage.setItem('access_token', token)
}

export function getTokenFromLocalStorage() {
    return localStorage.getItem('access_token')
}