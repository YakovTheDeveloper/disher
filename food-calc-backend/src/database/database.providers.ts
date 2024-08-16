

import { Dish } from 'foodCollection/dish/dish.entity';
import { DishProduct } from 'foodCollection/dish/dishProduct.entity';
import { Menu } from 'foodCollection/menu/menu.entity';
import { MenuProduct } from 'foodCollection/menu/menuProduct/menuProduct.entity';
import { Nutrient } from 'nutrients/entities/nutrient.entity';
import { Product } from 'products/entities/product.entity';

import { ProductsNutrient } from 'products_nutrients/entities/products_nutrient.entity';
import { DataSource } from 'typeorm';
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
        entities: [User, Nutrient, Product, MenuProduct, Menu, ProductsNutrient, Dish, DishProduct],
        synchronize: true,
      });
      return dataSource.initialize();
    },
  },
];

console.log(__dirname + '/../**/*.entity.{js,ts}')