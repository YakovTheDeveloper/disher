import { DataSource } from 'typeorm';
import { PRODUCTS_NUTRIENTS_REPOSITORY } from 'constants/provide';
import { ProductsNutrient } from './entities/products_nutrient.entity';

export const productsNutrientsProvider = [
    {
        provide: PRODUCTS_NUTRIENTS_REPOSITORY,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(ProductsNutrient),
        inject: ['DATA_SOURCE'],
    },
];