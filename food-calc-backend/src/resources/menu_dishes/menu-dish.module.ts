import { Module } from '@nestjs/common';
import { DatabaseModule } from 'database/database.module';
import { dishProviders } from 'foodCollection/dish/dish.providers';
import { MenusModule } from 'foodCollection/menu/menus.module';
import { menusProviders } from 'foodCollection/menu/menus.providers';
import { AuthModule } from 'resources/auth/auth.module';
import { JwtStrategy } from 'resources/auth/jwt.strategy';
import { MenuDishController } from 'resources/menu_dishes/menu-dish.controller';
import { menuDishProviders } from 'resources/menu_dishes/menu-dish.providers';
import { MenuDishService } from 'resources/menu_dishes/menu-dish.service';
import { UsersModule } from 'users/users.module';
import { usersProviders } from 'users/users.providers';
import { UsersService } from 'users/users.service';


@Module({
    imports: [DatabaseModule, UsersModule, AuthModule, MenusModule],
    controllers: [MenuDishController],
    providers: [...menusProviders, ...dishProviders, ...menuDishProviders, MenuDishService, JwtStrategy, UsersService, ...usersProviders, MenuDishService],
})
export class MenuDishModule { }
