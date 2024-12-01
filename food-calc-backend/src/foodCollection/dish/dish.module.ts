import { Module } from '@nestjs/common';
import { dishProviders } from './dish.providers';
import { DatabaseModule } from 'database/database.module';
import { UsersModule } from 'users/users.module';
import { usersProviders } from 'users/users.providers';
import { UsersService } from 'users/users.service';

import { JwtStrategy } from 'resources/auth/jwt.strategy';
import { AuthModule } from 'resources/auth/auth.module';
import { DishController } from 'foodCollection/dish/dish.controller';
import { DishService } from 'foodCollection/dish/dish.service';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule],
  controllers: [DishController],
  providers: [...dishProviders, UsersService, ...usersProviders, JwtStrategy, DishService],
})
export class DishModule { }
