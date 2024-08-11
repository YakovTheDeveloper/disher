import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { menusProviders } from './menus.providers';
import { DatabaseModule } from 'database/database.module';
import { UsersModule } from 'users/users.module';
import { usersProviders } from 'users/users.providers';
import { UsersService } from 'users/users.service';
import { MenuProductModule } from 'menu_product/menu_product.module';
import { menuProductProviders } from 'menu_product/menu_product.providers';
import { MenuProductService } from 'menu_product/menu_product.service';

@Module({
  imports: [DatabaseModule, UsersModule, MenuProductModule],
  controllers: [MenusController],
  providers: [MenusService, MenuProductService, ...menusProviders, UsersService, ...usersProviders, MenuProductModule, ...menuProductProviders],
})
export class MenusModule { }
