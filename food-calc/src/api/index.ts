import { getTokenFromLocalStorage } from "@/lib/storage/localStorage";
import { Response } from "@/types/api/common";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Create Axios Instance
export const axiosInstance: AxiosInstance = axios.create({
    baseURL: "http://localhost:3000",
    timeout: 5000,
});

axiosInstance.interceptors.request.use((config) => {
    const token = getTokenFromLocalStorage();
    if (token) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
        };
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            // window.location.href = "/login"; // Or MobX store logout action
        }
        return Promise.reject(error);
    }
);

// Utility: Get Authorization Header
export function AuthorizationHeader(): AxiosRequestConfig {
    const token = getTokenFromLocalStorage();
    return token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
}

async function apiRequest<T>(
    method: "get" | "post" | "patch" | "put" | "delete",
    url: string,
    payload?: any,
    config?: AxiosRequestConfig
): Promise<Response<T>> {
    try {
        const response: AxiosResponse<{
            result: T
            isError: boolean
        }> = await axiosInstance({
            method,
            url,
            data: payload,
            ...config,
        });
        return { data: response.data.result, isError: false };
    } catch (error) {
        const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : "Unexpected error occurred";
        return { isError: true, error: errorMessage };
    }
}

export const api = {
    get: <T>(url: string, config?: AxiosRequestConfig) =>
        apiRequest<T>("get", url, undefined, config),

    post: <T>(url: string, payload: any, config?: AxiosRequestConfig) =>
        apiRequest<T>("post", url, payload, config),

    patch: <T>(url: string, payload: any, config?: AxiosRequestConfig) =>
        apiRequest<T>("patch", url, payload, config),

    put: <T>(url: string, payload: any, config?: AxiosRequestConfig) =>
        apiRequest<T>("put", url, payload, config),

    delete: <T>(url: string, config?: AxiosRequestConfig) =>
        apiRequest<T>("delete", url, undefined, config),
};

// API Routes
export const apiRoutes = {
    products: {
        get: "products",
    },
    richNutrientProducts: {
        get: (id: number) => `products/rich/?nutrient_id=${id}`
    },
    productsWithNutrients: {
        get: (ids: number[]) => `products/nutrients?ids=${ids.join(",")}`,
    },
    auth: {
        signUp: "auth/signUp",
        signIn: "auth/signIn",
        user: "auth/me",
    },
    menu: {
        create: "menus",
        update: (id: number) => `menus/${id}`,
        get: (id: number) => `menus/${id}`,
        delete: (id: number) => `menus/${id}`,
        getAll: "menus",
    },
    day: {
        create: "day",
        getAll: "day",
        update: (id: number) => `day/${id}`,
        get: (id: number) => `day/${id}`,
        delete: (id: number) => `day/${id}`,
    },
    norm: {
        create: "norm",
        update: (id: number) => `norm/${id}`,
        delete: (id: number) => `norm/${id}`,
        getAll: "norm",
    },
    dish: {
        create: "dish",
        update: (id: number) => `dish/${id}`,
        get: (id: number) => `dish/${id}`,
        delete: (id: number) => `dish/${id}`,
        getAll: "dish",
    },
    dishProducts: {
        get: (query: string) => `dish/products/?dish_ids=${query}`,
    },
};


// const errorMessages: Record<number, string> = {
//     400: "Bad Request",
//     401: "Unauthorized. Please log in again.",
//     403: "Forbidden. You don't have permission.",
//     404: "Resource not found.",
//     500: "Server error. Please try again later.",
// };

// function getErrorMessage(error: any): string {
//     if (axios.isAxiosError(error)) {
//         const status = error.response?.status;
//         return errorMessages[status] || error.response?.data?.message || "An error occurred.";
//     }
//     return "An unexpected error occurred.";
// }

