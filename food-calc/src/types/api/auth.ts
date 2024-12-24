import { Response } from "@/types/api/common"

export type SignUpPayload = {
    "login": string,
    "password": string,
    "confirmPassword": string
}

export type SignInPayload = {
    "login": string,
    "password": string,
}

export type AuthResponse = Response<{
    login: string,
    access_token: string
}>