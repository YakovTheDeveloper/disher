import { Module } from '@nestjs/common';
import { dishProviders } from './dish.providers';
import { DatabaseModule } from 'database/database.module';
import { UsersModule } from 'users/users.module';
import { usersProviders } from 'users/users.providers';
import { menuProductProviders } from 'menu_product/menu_product.providers';
import { UsersService } from 'users/users.service';
import { Repository } from 'typeorm';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';

import { JwtStrategy } from 'resources/auth/jwt.strategy';
import { AuthModule } from 'resources/auth/auth.module';
import { DishController } from 'foodCollection/dish/dish.controller';
import { DishService } from 'foodCollection/dish/dish.service';
import { DishProductService } from 'foodCollection/dish/dishProduct/dishProduct.service';
import { DayModule } from 'resources/day/day.module';
import { dayProdivers } from 'resources/day/day.providers';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule],
  controllers: [DishController],
  providers: [...dishProviders, UsersService, ...usersProviders, JwtStrategy, DishService, DishProductService],
})
export class DishModule { }
