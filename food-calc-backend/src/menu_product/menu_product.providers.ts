import { MENU_PRODUCT_REPOSITORY } from "constants/provide";
import { DataSource } from "typeorm";
import { MenuProduct } from "./entities/menu_product.entity";

export const menuProductProviders = [
    {
        provide: MENU_PRODUCT_REPOSITORY,
        useFactory: (dataSource: DataSource) => {
            const repository = dataSource.getRepository(MenuProduct);

            return {
                repository,
                dataSource, // Add the query runner to the returned object
            };
        },
        inject: ['DATA_SOURCE'],
    },
];