import { MENUS_REPOSITORY } from "constants/provide";
import { DataSource } from "typeorm";
import { Menu } from "./entities/menu.entity";

export const menusProviders = [
    {
        provide: MENUS_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Menu),
        inject: ['DATA_SOURCE'],
    },
];