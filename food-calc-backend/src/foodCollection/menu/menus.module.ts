import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { menusProviders } from './menus.providers';
import { DatabaseModule } from 'database/database.module';
import { UsersModule } from 'users/users.module';
import { usersProviders } from 'users/users.providers';
import { menuProductProviders } from 'menu_product/menu_product.providers';
import { UsersService } from 'users/users.service';
import { MENU_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';
import { MenusService } from './menus.service';
import { MenuProductService } from './menuProduct.service';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [MenusController],
  providers: [...menusProviders, UsersService, ...usersProviders, MenusService, MenuProductService],
})
export class MenusModule { }
