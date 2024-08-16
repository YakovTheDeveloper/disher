import { Inject, Injectable } from '@nestjs/common';

import { MENU_REPOSITORY, MENUS_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { UsersService } from 'users/users.service';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';
import { Menu } from './menu.entity';
import { FoodCollectionProductService } from 'foodCollection/common/foodCollection_product.service';
import { MenuProductService } from './menuProduct.service';

@Injectable()
export class MenusService extends FoodCollectionService {
  constructor(
    @Inject(MENU_REPOSITORY)
    menusRepository: Repository<Menu>,
    @Inject(UsersService)
    usersService: UsersService,
    @Inject(MenuProductService)
    menuProductService: FoodCollectionProductService,
  ) {
    super(menusRepository, usersService, menuProductService)
  }
}

