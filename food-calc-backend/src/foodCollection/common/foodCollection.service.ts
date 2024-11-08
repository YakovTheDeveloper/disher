import { Inject, Injectable } from '@nestjs/common';

import { MENUS_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { UsersModule } from 'users/users.module';
import { UsersService } from 'users/users.service';
import { MenuProductService } from 'menu_product/menu_product.service';
import { Product } from 'products/entities/product.entity';
import { compareProducts, createProductIdToMenuProduct } from 'lib/update';
import { CreateFoodCollectionDto } from 'foodCollection/common/dto/create-foodCollection.dto';
import { UpdateFoodCollectionDto } from 'foodCollection/common/dto/update-foodCollection.dto';
import { FoodCollection } from './entities/foodCollection.entity';
import { FoodCollectionProductService } from './foodCollection_product.service';
import { CreateFoodCollectionProductDto } from './dto/create-foodCollection_product.dto';
import { Menu } from 'foodCollection/menu/menu.entity';
import { User } from 'users/entities/user.entity';

@Injectable()
export class FoodCollectionService {

    constructor(
        private repository: Repository<FoodCollection>,
        private usersService: UsersService,
        private foodCollectionProductService: FoodCollectionProductService,
    ) { }

    async create(createFoodCollectionDto: CreateFoodCollectionDto, userId: number) {
        const { products } = createFoodCollectionDto

        const user = new User()
        user.id = userId

        const foodCollection = this.repository.create({
            ...createFoodCollectionDto,
            user
        })

        const productsToAdd: CreateFoodCollectionProductDto[] = []

        for (const id in products) {
            const productQuantity = products[id]
            const productToAdd = new Product()
            productToAdd.id = +id

            const foodProduct = new CreateFoodCollectionProductDto()
            foodProduct.product = productToAdd
            foodProduct.menu = foodCollection
            foodProduct.dish = foodCollection
            foodProduct.quantity = productQuantity

            productsToAdd.push(foodProduct)
        }

        const createdMenu = await this.repository.save(foodCollection)
        await this.foodCollectionProductService.create(productsToAdd)

        const { user: menuUser, ...result } = createdMenu

        return result
    }

    async findAll(userId: number) {
        const menus = await this.repository.find({
            where: { user: { id: userId } }
        });
        return menus
    }

    async findOne(id: number, userId: number) {
        const productsWithNutrients = await this.foodCollectionProductService.findProducts(id) as any
        const result = Object.values(productsWithNutrients.reduce((acc, item) => {
            const { id, name, quantity, nutrientId, nutrientQuantity } = item;

            if (!acc[id]) {
                acc[id] = {
                    name,
                    quantity,
                    id,
                    nutrients: {}
                };
            }

            acc[id].nutrients[nutrientId] = nutrientQuantity;

            return acc;
        }, {}));

        return {
            data: result,
            error: null
        }
    }

    async update(menuId: number, { products: updatedProducts, description, name }: UpdateFoodCollectionDto) {
        if (description || name) {
            const menu = new Menu()
            menu.id = menuId
            description && (menu.description = description)
            name && (menu.name = name)
            await this.repository.save(menu)
        }

        if (!updatedProducts) {
            return 'Done'
        }

        const menus = await this.foodCollectionProductService.findProductWithQuantityByMenuId(menuId)

        const { initialMenuProducts, productToQuantity } = createProductIdToMenuProduct(menus)

        const delta = compareProducts(productToQuantity, updatedProducts)

        const result = await this.foodCollectionProductService.updateWithDelta({ delta, menuId, initialMenuProducts })
        return result
    }

    remove(id: number) {
        const menu = new Menu()
        menu.id = id
        this.repository.remove(menu)
        return {
            result: true
        }
    }
}

