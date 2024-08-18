import axios from 'axios';


export const axiosInstance = axios.create({
    baseURL: "http://localhost:3000"
})


export const api = {
    get: async (url: string) => {
        const result = await axiosInstance.get(url)
        if (result) return result.data
    }
}

export const apiRoutes = {
    products: {
        get: 'products'
    },
    productsWithNutrients: {
        get: (ids: number[]) => `products/nutrients?ids=${ids}`
    }
}

