import { Inject, Injectable } from '@nestjs/common';

import { MENU_PRODUCT_REPOSITORY } from 'constants/provide';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { Id, IdToItem, UpdateDelta } from 'common/types';
import { isEmpty } from 'lib/utils/isEmpty';
import { Product } from 'products/entities/product.entity';
import { isNotEmpty } from 'class-validator';
import { CreateFoodCollectionProductDto } from './dto/create-foodCollection_product.dto';
import { UpdateFoodCollectionProductDto } from './dto/update-foodCollection_product.dto';
import { FoodCollectionProduct } from './entities/foodCollectionProduct.entity';
import { FoodCollection } from './entities/foodCollection.entity';
import { MenuProduct } from 'foodCollection/menu/menuProduct/menuProduct.entity';
import { Dish } from 'foodCollection/dish/dish.entity';
import { DishProduct } from 'foodCollection/dish/dishProduct.entity';
import { Menu } from 'foodCollection/menu/menu.entity';

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

type IMenuProductService = {
  updateWithDelta: (data: UpdateData) => Promise<any>
}

@Injectable()
export class FoodCollectionProductService implements IMenuProductService {

  constructor(
    // @Inject(MENU_PRODUCT_REPOSITORY)
    private source: { repository: Repository<FoodCollectionProduct>; dataSource: DataSource },
    private manyProductsToOne: 'menu' | 'dish',
    private FoodProductEntity: new () => MenuProduct | DishProduct,
    private FoodCollectionEntity: new () => Menu | Dish
  ) { }

  async create(dto: CreateFoodCollectionProductDto[]) {

    return this.source.repository.save(dto)
  }

  async findProductWithQuantityByMenuId(menuId: number): Promise<MenuProductData[]> {
    return this.source.repository
      .createQueryBuilder('menuProduct')
      .leftJoin('menuProduct.product', 'product')
      .select([
        'menuProduct.id AS "menuProductId"',
        'menuProduct.quantity AS quantity',
        'product.id AS "productId"'
      ])
      .where('menuProduct.menuId = :menuId', { menuId })
      .getRawMany();
  }

  async findProducts(menuId: number): Promise<MenuProductData[]> {
    return this.source.repository
      .createQueryBuilder('menuProduct')
      .leftJoin('menuProduct.product', 'product')
      .leftJoin('product.productNutrients', 'productNutrients')
      .select([
        'productNutrients.quantity AS "nutrientQuantity"',
        'productNutrients.nutrientId AS "nutrientId"',
        'product.name AS "name"',
        'menuProduct.quantity AS "quantity"',
        'product.id AS "id"'
      ])
      .where('menuProduct.menuId = :menuId', { menuId })
      .getRawMany();
  }


  // async findAllProducts(userId: number): Promise<MenuProductData[]> {
  //   return this.source.repository
  //     .createQueryBuilder('menu')
  //     .leftJoinAndSelect('menu.menuToProducts', 'menuProduct') // Join menuProducts
  //     .leftJoinAndSelect('menuProduct.product', 'product') // Join products related to menuProducts
  //     .where('menu.userId = :userId', { userId }) // Filter by userId
  //     .getMany();
  // }


  findOne(id: number) {
    return `This action returns a #${id} menuProduct`;
  }

  update(updateMenuProductDto: UpdateFoodCollectionProductDto[]) {
    return this.source.repository.save(updateMenuProductDto)
  }

  async updateWithDelta({ delta, menuId, initialMenuProducts }: UpdateData) {
    const { productsCreated, productsRemoved, productsUpdated } = delta

    const foodCollectionToUpdate: FoodCollection = new FoodCollection()
    foodCollectionToUpdate.id = menuId

    const toRemove: FoodCollectionProduct[] = []
    const toUpdate: FoodCollectionProduct[] = []
    const toAddOrUpdate = { ...productsCreated, ...productsUpdated }


    console.log("OOOOOOOOO", this.source.repository.metadata.name)

    for (const productId in toAddOrUpdate) {
      const quantity = toAddOrUpdate[productId]
      const collectionProduct = new this.FoodProductEntity()
      const product = new Product()
      product.id = +productId

      collectionProduct.quantity = quantity
      collectionProduct[this.manyProductsToOne] = foodCollectionToUpdate
      collectionProduct.product = product

      const existedMenuProduct = initialMenuProducts[productId]
      if (existedMenuProduct) {
        collectionProduct.id = existedMenuProduct.menuProductId
      }

      toUpdate.push(collectionProduct)
    }

    for (const productId in productsRemoved) {
      const collectionProduct = new this.FoodProductEntity()
      const existedMenuProduct = initialMenuProducts[productId]
      if (existedMenuProduct) {
        collectionProduct.id = existedMenuProduct.menuProductId
      }
      toRemove.push(collectionProduct)
    }

    const queryRunner = this.source.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction();
    const menuToAdd = new this.FoodCollectionEntity()
    menuToAdd.id = menuId

    try {
      if (isNotEmpty(toRemove)) await queryRunner.manager.remove(toRemove);
      if (isNotEmpty(toUpdate)) await queryRunner.manager.save(toUpdate);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err)
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  remove(ids: number[]) {
    const menuProductsToDelete = ids.map(id => {
      const menuProduct = new this.FoodProductEntity()
      menuProduct.id = id
      return menuProduct
    })
    return this.source.repository.remove(menuProductsToDelete)
  }
}
