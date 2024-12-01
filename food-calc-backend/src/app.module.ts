import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { NutrientsModule } from './nutrients/nutrients.module';
import { ProductsModule } from './products/products.module';
import { UserProductsModule } from './user_products/user_products.module';
import { ProductsNutrientsModule } from './products_nutrients/products_nutrients.module';
import { AuthModule } from 'resources/auth/auth.module';
import { DishModule } from 'foodCollection/dish/dish.module';
import { DayModule } from 'resources/day/day.module';
import { UserNormModule } from './user_norm/user_norm.module';

@Module({
  imports: [ConfigModule.forRoot(), UsersModule, NutrientsModule, ProductsModule, DishModule, UserProductsModule, ProductsNutrientsModule, AuthModule, DayModule, UserNormModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
