import { Inject, Injectable } from '@nestjs/common';

import { DISH_REPOSITORY, MENU_REPOSITORY, MENUS_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { UsersService } from 'users/users.service';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';
import { FoodCollectionProductService } from 'foodCollection/common/foodCollection_product.service';
import { DishProductService } from 'foodCollection/dish/dishProduct/dishProduct.service';
import { Dish } from 'foodCollection/dish/dish.entity';

@Injectable()
export class DishService extends FoodCollectionService {
  constructor(
    @Inject(DISH_REPOSITORY)
    dishRepository: Repository<Dish>,
    @Inject(UsersService)
    usersService: UsersService,
    @Inject(DishProductService)
    dishProductService: FoodCollectionProductService,
  ) {
    super(dishRepository, usersService, dishProductService)
  }
}

