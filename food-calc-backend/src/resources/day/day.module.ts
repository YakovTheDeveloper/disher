import { Module } from '@nestjs/common';
import { DayService } from './day.service';
import { DayController } from './day.controller';
import { UsersModule } from 'users/users.module';
import { dayProdivers } from 'resources/day/day.providers';
import { DishModule } from 'foodCollection/dish/dish.module';
import { dishProviders } from 'foodCollection/dish/dish.providers';
import { DishService } from 'foodCollection/dish/dish.service';
import { UsersService } from 'users/users.service';
import { usersProviders } from 'users/users.providers';
import { AuthModule } from 'resources/auth/auth.module';
import { DatabaseModule } from 'database/database.module';

@Module({
  imports: [UsersModule, DishModule, AuthModule, DatabaseModule],
  controllers: [DayController],
  providers: [DayService, ...dayProdivers, ...dishProviders, DishService, UsersService, ...usersProviders],
})
export class DayModule { }
