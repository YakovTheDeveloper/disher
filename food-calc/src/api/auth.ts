import { api, apiRoutes } from "@/api"
import { AuthResponse, SignInPayload, SignUpPayload } from "@/types/api/auth"

export async function fetchSignUp(payload: SignUpPayload): Promise<AuthResponse> {
    return await api.post(apiRoutes.auth.signUp, payload)
}


export async function fetchSignIn(payload: SignInPayload): Promise<AuthResponse> {
    return await api.post(apiRoutes.auth.signIn, payload)
}