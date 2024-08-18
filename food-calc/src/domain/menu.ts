import { IMenu } from "@/types/menu/Menu";

export const getMenuProductIds = (menu: IMenu) => {
    return menu.products.map(({ id }) => +id)
}