import { DataSource } from 'typeorm';
import { DAY_CATEGORY_DISH_REPOSITORY, DAY_CATEGORY_REPOSITORY, DAY_REPOSITORY, PRODUCTS_NUTRIENTS_REPOSITORY } from 'constants/provide';
import { Day } from 'resources/day/entities/day.entity';
import { DayCategory } from 'resources/day/entities/day_category.entity';
import { DayCategoryDish } from 'resources/day/entities/day_category_dish.entity';

export const dayProdivers = [
    {
        provide: DAY_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Day),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: DAY_CATEGORY_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(DayCategory),
        inject: ['DATA_SOURCE'],
    },
    {
        provide: DAY_CATEGORY_DISH_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(DayCategoryDish),
        inject: ['DATA_SOURCE'],
    },
];