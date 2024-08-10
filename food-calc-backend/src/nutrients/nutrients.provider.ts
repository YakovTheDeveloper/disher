import { DataSource } from "typeorm";
import { Nutrient } from "./entities/nutrient.entity";
import { NUTRIENTS_REPOSITORY } from "constants/provide";

export const nutrientsProviders = [
    {
        provide: NUTRIENTS_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Nutrient),
        inject: ['DATA_SOURCE'],
    },
];