import { Inject, Injectable } from '@nestjs/common';
import { MENU_PRODUCT_REPOSITORY } from 'constants/provide';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Id, IdToItem, UpdateDelta } from 'common/types';
import { isEmpty } from 'lib/utils/isEmpty';
import { Menu } from 'menus/entities/menu.entity';
import { Product } from 'products/entities/product.entity';
import { isNotEmpty } from 'class-validator';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';
import { FoodCollectionProduct } from 'foodCollection/common/entities/foodCollectionProduct.entity';
import { FoodCollectionProductService } from 'foodCollection/common/foodCollection_product.service';
import { CreateFoodCollectionProductDto } from 'foodCollection/common/dto/create-foodCollection_product.dto';
import { UpdateFoodCollectionProductDto } from 'foodCollection/common/dto/update-foodCollection_product.dto';
import { MenuProduct } from './menuProduct.entity';

type UpdateData = {
    delta: UpdateDelta,
    initialMenuProducts: IdToItem<MenuProductData>
    menuId: number
}

type MenuProductData = {
    menuProductId: Id,
    productId: Id
    quantity: number
}

@Injectable()
export class MenuProductService extends FoodCollectionProductService {

    constructor(
        @Inject(MENU_PRODUCT_REPOSITORY)
        source: { repository: Repository<FoodCollectionProduct>; dataSource: DataSource }

    ) {
        super(source, 'menu', MenuProduct, Menu)
    }

    async create(dto: CreateFoodCollectionProductDto[]) {
        return super.create(dto)
    }

    async findProductWithQuantityByMenuId(menuId: number) {
        return super.findProductWithQuantityByMenuId(menuId)
    }

    findOne(id: number) {
        return super.findOne(id)
    }

    update(dto: UpdateFoodCollectionProductDto[]) {
        return super.update(dto)
    }

    remove(ids: number[]) {
        return super.remove(ids)
    }
}
