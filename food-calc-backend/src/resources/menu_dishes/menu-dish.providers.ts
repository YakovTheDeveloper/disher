import { DISH_PRODUCT_REPOSITORY, DISH_REPOSITORY, MENU_DISH_REPOSITORY, MENU_PRODUCT_REPOSITORY, MENU_REPOSITORY } from "constants/provide";
import { DataSource } from "typeorm";

import { Dish } from "foodCollection/dish/dish.entity";
import { DishProduct } from "foodCollection/dish/dishProduct/dishProduct.entity";
import { MenuDish } from "resources/menu_dishes/menu-dish.entity";

export const menuDishProviders = [
    {
        provide: MENU_DISH_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(MenuDish),
        inject: ['DATA_SOURCE'],
    },
];
