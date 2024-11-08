import { IMenu, IProductBase } from "@/types/menu/Menu";
import { IProduct } from "@/types/product/product";

export const getMenuProductIds = (products: IProductBase[]) => {
    return products.map(({ id }) => +id)
}