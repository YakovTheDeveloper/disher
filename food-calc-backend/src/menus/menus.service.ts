import { Inject, Injectable } from '@nestjs/common';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MENUS_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { UsersModule } from 'users/users.module';
import { UsersService } from 'users/users.service';
import { MenuProductService } from 'menu_product/menu_product.service';
import { CreateMenuProductDto } from 'menu_product/dto/create-menu_product.dto';
import { Product } from 'products/entities/product.entity';
import { compareProducts, createProductIdToMenuProduct } from 'lib/update';

@Injectable()
export class MenusService {

  constructor(
    @Inject(MENUS_REPOSITORY)
    private menusRepository: Repository<Menu>,
    @Inject(UsersService)
    private usersService: UsersService,
    @Inject(MenuProductService)
    private menuProductService: MenuProductService,
  ) { }

  async create(createMenuDto: CreateMenuDto) {

    const { products } = createMenuDto

    const menu = this.menusRepository.create(createMenuDto)

    const productsToAdd: CreateMenuProductDto[] = []

    for (const id in products) {
      const productQuantity = products[id]
      const productToAdd = new Product()
      productToAdd.id = +id

      const menuProduct = new CreateMenuProductDto()
      menuProduct.product = productToAdd
      menuProduct.menu = menu
      menuProduct.quantity = productQuantity

      productsToAdd.push(menuProduct)
    }

    await this.menusRepository.save(menu)
    await this.menuProductService.create(productsToAdd)

    return products
  }

  findAll() {
    return `This action returns all menus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} menu`;
  }

  async update(menuId: number, { products: updatedProducts, description, name, user }: UpdateMenuDto) {
    if (description || name) {
      const menu = new Menu()
      menu.id = menuId
      description && (menu.description = description)
      name && (menu.name = name)
      await this.menusRepository.save(menu)
    }

    if (!updatedProducts) {
      return 'Done'
    }

    const menus = await this.menuProductService.findProductWithQuantityByMenuId(menuId)

    const { initialMenuProducts, productToQuantity } = createProductIdToMenuProduct(menus)

    const delta = compareProducts(productToQuantity, updatedProducts)

    const result = await this.menuProductService.updateWithDelta({ delta, menuId, initialMenuProducts })
    return 'Done'
  }

  remove(id: number) {
    const menu = new Menu()
    menu.id = id
    this.menusRepository.remove(menu)
    return `This action removes a #${id} menu`;
  }
}

