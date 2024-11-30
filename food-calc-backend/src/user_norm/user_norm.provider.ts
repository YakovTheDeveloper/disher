import { DataSource } from "typeorm";
import { NUTRIENTS_REPOSITORY, USER_NORMS_REPOSITORY } from "constants/provide";
import { UserNorm } from "user_norm/entities/user_norm.entity";

export const userNormProviders = [
    {
        provide: USER_NORMS_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(UserNorm),
        inject: ['DATA_SOURCE'],
    },
];