import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { menusProviders } from './menus.providers';
import { DatabaseModule } from 'database/database.module';
import { UsersModule } from 'users/users.module';
import { usersProviders } from 'users/users.providers';
import { UsersService } from 'users/users.service';

@Module({
  imports: [DatabaseModule, UsersModule],
  controllers: [MenusController],
  providers: [MenusService, ...menusProviders, UsersService, ...usersProviders],
})
export class MenusModule { }
