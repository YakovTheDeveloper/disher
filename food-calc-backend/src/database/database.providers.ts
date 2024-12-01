

import { Dish } from 'foodCollection/dish/dish.entity';
import { DishProduct } from 'foodCollection/dish/dishProduct/dishProduct.entity';

import { Nutrient } from 'nutrients/entities/nutrient.entity';
import { Product } from 'products/entities/product.entity';

import { ProductsNutrient } from 'products_nutrients/entities/products_nutrient.entity';
import { Day } from 'resources/day/entities/day.entity';
import { DayCategory } from 'resources/day/entities/day_category.entity';
import { DayCategoryDish } from 'resources/day/entities/day_category_dish.entity';
import { DataSource } from 'typeorm';
import { UserNorm } from 'user_norm/entities/user_norm.entity';
import { User } from 'users/entities/user.entity';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'yakov',
        password: '0912',
        database: 'postgres',
        entities: [User, Nutrient, Product, ProductsNutrient, Dish, DishProduct, Day, DayCategory, DayCategoryDish, UserNorm],
        synchronize: true,
      });
      return dataSource.initialize();
    },
  },
];

console.log(__dirname + '/../**/*.entity.{js,ts}')