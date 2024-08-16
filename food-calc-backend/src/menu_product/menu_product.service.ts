import { Inject, Injectable } from '@nestjs/common';
import { CreateMenuProductDto } from './dto/create-menu_product.dto';
import { UpdateMenuProductDto } from './dto/update-menu_product.dto';
import { MENU_PRODUCT_REPOSITORY } from 'constants/provide';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { MenuProduct } from './entities/menu_product.entity';
import { Id, IdToItem, UpdateDelta } from 'common/types';
import { isEmpty } from 'lib/utils/isEmpty';
import { Menu } from 'menus/entities/menu.entity';
import { Product } from 'products/entities/product.entity';
import { isNotEmpty } from 'class-validator';

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
  updateWithDelta: (data: UpdateData) => Promise<void>
}

@Injectable()
export class MenuProductService implements IMenuProductService {

  constructor(
    @Inject(MENU_PRODUCT_REPOSITORY)
    private menuProductRepository: { repository: Repository<MenuProduct>; dataSource: DataSource }

  ) { }

  async create(createMenuProductDto: CreateMenuProductDto[]) {
    return this.menuProductRepository.repository.save(createMenuProductDto)
  }

  async findProductWithQuantityByMenuId(menuId: number): Promise<MenuProductData[]> {
    return this.menuProductRepository.repository
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

  findOne(id: number) {
    return `This action returns a #${id} menuProduct`;
  }

  update(updateMenuProductDto: UpdateMenuProductDto[]) {
    return this.menuProductRepository.repository.save(updateMenuProductDto)
  }

  async updateWithDelta({ delta, menuId, initialMenuProducts }: UpdateData) {
    // const { productsCreated, productsRemoved, productsUpdated } = delta

    // const menuToUpdate: Menu = new Menu()
    // menuToUpdate.id = menuId

    // const toRemove: MenuProduct[] = []
    // const toUpdate: MenuProduct[] = []
    // const toAddOrUpdate = { ...productsCreated, ...productsUpdated }

    // for (const productId in toAddOrUpdate) {
    //   const quantity = toAddOrUpdate[productId]
    //   const menuProduct = new MenuProduct()
    //   const product = new Product()
    //   product.id = +productId

    //   menuProduct.quantity = quantity
    //   menuProduct.menu = menuToUpdate
    //   menuProduct.product = product

    //   const existedMenuProduct = initialMenuProducts[productId]
    //   if (existedMenuProduct) {
    //     menuProduct.id = existedMenuProduct.menuProductId
    //   }

    //   toUpdate.push(menuProduct)
    // }

    // for (const productId in productsRemoved) {
    //   const menuProduct = new MenuProduct()
    //   const existedMenuProduct = initialMenuProducts[productId]
    //   if (existedMenuProduct) {
    //     menuProduct.id = existedMenuProduct.menuProductId
    //   }
    //   toRemove.push(menuProduct)
    // }

    // const queryRunner = this.menuProductRepository.dataSource.createQueryRunner()
    // await queryRunner.connect()
    // await queryRunner.startTransaction();
    // const menuToAdd = new Menu()
    // menuToAdd.id = menuId

    // try {
    //   if (isNotEmpty(toRemove)) await queryRunner.manager.remove(toRemove);
    //   if (isNotEmpty(toUpdate)) await queryRunner.manager.save(toUpdate);
    //   await queryRunner.commitTransaction();
    // } catch (err) {
    //   await queryRunner.rollbackTransaction();
    // } finally {
    //   await queryRunner.release();
    // }
  }

  remove(ids: number[]) {
    const menuProductsToDelete = ids.map(id => {
      const menuProduct = new MenuProduct()
      menuProduct.id = id
      return menuProduct
    })
    return this.menuProductRepository.repository.remove(menuProductsToDelete)
  }
}
