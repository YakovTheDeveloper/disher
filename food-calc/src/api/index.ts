import { getTokenFromLocalStorage } from "@/lib/storage/localStorage";
import { Response } from "@/types/api/common";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// Create Axios Instance
export const axiosInstance: AxiosInstance = axios.create({
    baseURL: "http://localhost:3000",
    timeout: 5000, // Optional: Add a timeout for better handling
});

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


// API Methods
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

// Example Usage: 
// Fetch products
async function fetchProducts() {
    try {
        const products = await api.get<any[]>(apiRoutes.products.get);
        console.log(products);
    } catch (error) {
        console.error(error.message);
    }
}


// import { FoodCollection } from '@/api/dish';
// import { getTokenFromLocalStorage } from '@/lib/storage/localStorage';
// import axios, { AxiosRequestConfig } from 'axios';


// export const axiosInstance = axios.create({
//     baseURL: "http://localhost:3000"
// })


// export const api = {
//     get: async (url: string, config?: AxiosRequestConfig<any>) => {
//         const result = await axiosInstance.get(url, config)
//         if (result) return result.data
//     },
//     post: async (url: string, payload: any, config?: AxiosRequestConfig<any>) => {
//         const result = await axiosInstance.post(url, payload, config)
//         if (result) return result.data
//     },
//     patch: async (url: string, payload: any, config?: AxiosRequestConfig<any>) => {
//         const result = await axiosInstance.patch(url, payload, config)
//         if (result) return result.data
//     },
//     put: async (url: string, payload: any, config?: AxiosRequestConfig<any>) => {
//         const result = await axiosInstance.put(url, payload, config)
//         if (result) return result.data
//     },
//     delete: async (url: string, config?: AxiosRequestConfig<any>) => {
//         const result = await axiosInstance.delete(url, config)
//         if (result) return result.data
//     },
// }

// export const apiRoutes = {
//     products: {
//         get: 'products'
//     },
//     productsWithNutrients: {
//         get: (ids: number[]) => `products/nutrients?ids=${ids}`
//     },
//     auth: {
//         signUp: 'auth/signUp',
//         signIn: 'auth/signIn',
//     },
//     menu: {
//         create: 'menus',
//         update: (id: number) => `menus/${id}`,
//         get: (id: number) => `menus/${id}`,
//         delete: (id: number) => `menus/${id}`,
//         getAll: 'menus'
//     },
//     day: {
//         create: 'day',
//         getAll: 'day',
//         update: (id: number) => `${'day'}/${id}`,
//         get: (id: number) => `${'day'}/${id}`,
//         delete: (id: number) => `${'day'}/${id}`,
//     },
//     norm: {
//         create: 'norm',
//         update: (id: number) => `norm/${id}`,
//         delete: (id: number) => `norm/${id}`,
//         getAll: 'norm'
//     },
//     dish: {
//         create: `${'dish'}`,
//         update: (id: number) => `${'dish'}/${id}`,
//         get: (id: number) => `${'dish'}/${id}`,
//         delete: (id: number) => `${'dish'}/${id}`,
//         getAll: `${'dish'}`
//     },
//     dishProducts: {
//         get: (query: string) => `${'dish'}/products/?dish_ids=${query}`,
//     }
// }

// export function AuthorizationHeader() {
//     return {
//         headers: {
//             Authorization: `Bearer ${getTokenFromLocalStorage()}`
//         }
//     }
// }