import { Inject, Injectable } from '@nestjs/common';

import { DISH_REPOSITORY, MENU_REPOSITORY, MENUS_REPOSITORY } from 'constants/provide';
import { In, Repository } from 'typeorm';
import { UsersService } from 'users/users.service';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';
import { FoodCollectionProductService } from 'foodCollection/common/foodCollection_product.service';
import { DishProductService } from 'foodCollection/dish/dishProduct/dishProduct.service';
import { Dish } from 'foodCollection/dish/dish.entity';
import { Menu } from 'foodCollection/menu/menu.entity';
import { compareProducts, createProductIdToMenuProduct } from 'lib/update';
import { UpdateFoodCollectionDto } from 'foodCollection/common/dto/update-foodCollection.dto';
import { CreateFoodCollectionDto } from 'foodCollection/common/dto/create-foodCollection.dto';
import { CreateFoodCollectionProductDto } from 'foodCollection/common/dto/create-foodCollection_product.dto';
import { Product } from 'products/entities/product.entity';
import { User } from 'users/entities/user.entity';

@Injectable()
export class DishService {
  constructor(
    @Inject(DISH_REPOSITORY)
    private dishRepository: Repository<Dish>,
    @Inject(UsersService)
    private usersService: UsersService,
    @Inject(DishProductService)
    private dishProductService: FoodCollectionProductService,
  ) { }

  async findAll(userId: number) {

    // const menus = await this.foodCollectionProductService.findAll(userId)
    const dishes = await this.dishRepository
      .createQueryBuilder("dish")
      .leftJoinAndSelect("dish.dishToProducts", "dishToProducts") // Adjust according to your entity
      .leftJoinAndSelect("dishToProducts.product", "product")
      .where("dish.user.id = :userId", { userId })
      .select([
        "dish.id",
        "dish.name", // Assuming `name` exists on `dish`
        "dishToProducts.quantity",
        "product.id",
        "product.name" // Assuming `name` exists on `product`
      ])
      .getMany();

    const mapped = dishes.map(item => ({
      id: item.id,
      name: item.name,
      //@ts-ignore
      products: item.dishToProducts.map(dishProduct => ({
        id: dishProduct.product.id,
        name: dishProduct.product.name,
        quantity: dishProduct.quantity
      }))
    }));
    return mapped



    // const menus = await this.repository.find({
    //     where: { user: { id: userId } }
    // });
    // return menus
  }

  async getDishProductData(userId: string, dishIds: string[]) {
    console.log(userId, dishIds)
    const result = await this.dishRepository.find({
      where: {
        user: { id: userId },
        id: In(dishIds),
      },
      relations: [
        'dishToProducts',            // Join dishToProducts
        'dishToProducts.product',    // Join products
        'dishToProducts.product.productNutrients', // Join productNutrients
      ],
    });
    const transformed = transformResult(result)
    return {
      result: transformed
    }
  }

  async create(createFoodCollectionDto: CreateFoodCollectionDto, userId: number) {
    const { products } = createFoodCollectionDto

    const user = new User()
    user.id = userId

    const foodCollection = this.dishRepository.create({
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

    const createdMenu = await this.dishRepository.save(foodCollection)
    await this.dishProductService.create(productsToAdd)

    const { user: menuUser, ...result } = createdMenu

    return result
  }


  async update(dishId: number, { products: updatedProducts, description, name }: UpdateFoodCollectionDto) {
    if (description || name) {
      const dish = new Dish()
      dish.id = dishId
      description && (dish.description = description)
      name && (dish.name = name)
      await this.dishRepository.save(dish)
    }

    if (!updatedProducts) {
      return 'Done'
    }

    const menus = await this.dishProductService.findProductWithQuantityByMenuId(dishId)

    const { initialMenuProducts, productToQuantity } = createProductIdToMenuProduct(menus)

    const delta = compareProducts(productToQuantity, updatedProducts)

    const result = await this.dishProductService.updateWithDelta({ delta, dishId, initialMenuProducts })
    return result
  }

  remove(id: number) {
    const dish = new Dish()
    dish.id = id
    this.dishRepository.remove(dish)
    return {
      result: true
    }
  }
}

function transformResult(result: any[]): { productId: number; nutrients: Record<number, number> }[] {
  const uniqueProducts = new Map<number, Record<number, number>>(); // Map to store unique products by ID

  result.forEach(dish => {
    dish.dishToProducts.forEach(dishToProduct => {
      const productId = dishToProduct.product.id;

      // If the product is not already in the map, add it
      if (!uniqueProducts.has(productId)) {
        const nutrients = dishToProduct.product.productNutrients.reduce((nutrientAcc, nutrient) => {
          nutrientAcc[nutrient.id] = nutrient.quantity;
          return nutrientAcc;
        }, {});

        uniqueProducts.set(productId, nutrients);
      }
    });
  });

  // Convert the map to an array of { productId, nutrients } objects
  return Array.from(uniqueProducts.entries()).map(([productId, nutrients]) => ({
    productId,
    nutrients,
  }));



}

