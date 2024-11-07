export type SignUpPayload = {
    "login": string,
    "password": string,
    "confirmPassword": string
}

export type SignInPayload = {
    "login": string,
    "password": string,
}

export type AuthResponse = {
    login: string,
    access_token: string
}