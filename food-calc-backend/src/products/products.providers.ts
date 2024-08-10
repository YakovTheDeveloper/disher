import { DataSource } from 'typeorm';

import { PRODUCTS_REPOSITORY } from 'constants/provide';
import { Product } from './entities/product.entity';

export const productsProvider = [
    {
        provide: PRODUCTS_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Product),
        inject: ['DATA_SOURCE'],
    },
];