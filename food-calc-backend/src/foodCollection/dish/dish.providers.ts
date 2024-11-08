import { DISH_PRODUCT_REPOSITORY, DISH_REPOSITORY, MENU_PRODUCT_REPOSITORY, MENU_REPOSITORY } from "constants/provide";
import { DataSource } from "typeorm";

import { Dish } from "foodCollection/dish/dish.entity";
import { DishProduct } from "foodCollection/dish/dishProduct/dishProduct.entity";

export const dishProviders = [
    {
        provide: DISH_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Dish),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: DISH_PRODUCT_REPOSITORY,
        useFactory: (dataSource: DataSource) => {
            const repository = dataSource.getRepository(DishProduct);

            return {
                repository,
                dataSource,
            };
        },
        inject: ['DATA_SOURCE'],
    },
];
