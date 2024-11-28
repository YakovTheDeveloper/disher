import { FoodCollection } from '@/api/menu';
import { getTokenFromLocalStorage } from '@/lib/storage/localStorage';
import axios, { AxiosRequestConfig } from 'axios';


export const axiosInstance = axios.create({
    baseURL: "http://localhost:3000"
})


export const api = {
    get: async (url: string, config?: AxiosRequestConfig<any>) => {
        const result = await axiosInstance.get(url, config)
        if (result) return result.data
    },
    post: async (url: string, payload: any, config?: AxiosRequestConfig<any>) => {
        const result = await axiosInstance.post(url, payload, config)
        if (result) return result.data
    },
    patch: async (url: string, payload: any, config?: AxiosRequestConfig<any>) => {
        const result = await axiosInstance.patch(url, payload, config)
        if (result) return result.data
    },
    put: async (url: string, payload: any, config?: AxiosRequestConfig<any>) => {
        const result = await axiosInstance.put(url, payload, config)
        if (result) return result.data
    },
    delete: async (url: string, config?: AxiosRequestConfig<any>) => {
        const result = await axiosInstance.delete(url, config)
        if (result) return result.data
    },
}

export const apiRoutes = {
    products: {
        get: 'products'
    },
    productsWithNutrients: {
        get: (ids: number[]) => `products/nutrients?ids=${ids}`
    },
    auth: {
        signUp: 'auth/signUp',
        signIn: 'auth/signIn',
    },
    menu: {
        create: 'menus',
        update: (id: number) => `menus/${id}`,
        get: (id: number) => `menus/${id}`,
        delete: (id: number) => `menus/${id}`,
        getAll: 'menus'
    },
    day: {
        create: 'day',
        getAll: 'day',
        update: (id: number) => `${'day'}/${id}`,
        get: (id: number) => `${'day'}/${id}`,
        delete: (id: number) => `${'day'}/${id}`,
    },
    dish: {
        create: `${'dish'}`,
        update: (id: number) => `${'dish'}/${id}`,
        get: (id: number) => `${'dish'}/${id}`,
        delete: (id: number) => `${'dish'}/${id}`,
        getAll: `${'dish'}`
    },
    dishProducts: {
        get: (query: string) => `${'dish'}/products/?dish_ids=${query}`,
    }
}

export function AuthorizationHeader() {
    return {
        headers: {
            Authorization: `Bearer ${getTokenFromLocalStorage()}`
        }
    }
}