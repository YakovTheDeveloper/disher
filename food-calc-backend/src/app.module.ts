import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { NutrientsModule } from './nutrients/nutrients.module';
import { ProductsModule } from './products/products.module';
import { MenusModule } from './menus/menus.module';
import { UserProductsModule } from './user_products/user_products.module';
import { ProductsNutrientsModule } from './products_nutrients/products_nutrients.module';
import { MenuProductModule } from './menu_product/menu_product.module';

@Module({
  imports: [ConfigModule.forRoot(), UsersModule, NutrientsModule, ProductsModule, MenusModule, UserProductsModule, ProductsNutrientsModule, MenuProductModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
