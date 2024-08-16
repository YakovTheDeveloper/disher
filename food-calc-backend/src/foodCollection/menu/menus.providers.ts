import { MENU_PRODUCT_REPOSITORY, MENU_REPOSITORY } from "constants/provide";
import { DataSource } from "typeorm";
import { Menu } from "./menu.entity";
import { MenuProduct } from "./menuProduct/menuProduct.entity";

export const menusProviders = [
    {
        provide: MENU_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Menu),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: MENU_PRODUCT_REPOSITORY,
        useFactory: (dataSource: DataSource) => {
            const repository = dataSource.getRepository(MenuProduct);

            return {
                repository,
                dataSource,
            };
        },
        inject: ['DATA_SOURCE'],
    },
];
