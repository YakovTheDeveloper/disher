import { Inject, Injectable } from '@nestjs/common';

import { DISH_REPOSITORY, MENU_REPOSITORY, MENUS_REPOSITORY } from 'constants/provide';
import { DataSource, In, Repository } from 'typeorm';
import { UsersService } from 'users/users.service';
import { FoodCollectionService } from 'foodCollection/common/foodCollection.service';
import { FoodCollectionProductService } from 'foodCollection/common/foodCollection_product.service';
import { DishProductService } from 'foodCollection/dish/dishProduct/dishProduct.service';
import { Dish } from 'foodCollection/dish/dish.entity';
import { Menu } from 'foodCollection/menu/menu.entity';
import { compareProducts, createProductIdToMenuProduct } from 'lib/update';
import { UpdateFoodCollectionDto } from 'foodCollection/common/dto/update-foodCollection.dto';
import { CreateDishDto, DishProductDto } from 'foodCollection/common/dto/create-foodCollection.dto';
import { CreateFoodCollectionProductDto } from 'foodCollection/common/dto/create-foodCollection_product.dto';
import { Product } from 'products/entities/product.entity';
import { User } from 'users/entities/user.entity';
import { DishProduct } from 'foodCollection/dish/dishProduct/dishProduct.entity';
import { classToPlain, instanceToPlain, plainToInstance } from 'class-transformer';

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

  async create(dto: CreateDishDto, userId: number) {
    const dish = createDish(userId, dto)
    const newDish = await this.dishRepository.save(dish)
    return { result: transformDish(newDish) }
  }

  async update(dishId: number, dto: UpdateFoodCollectionDto) {
    await this.dishRepository.manager.transaction(async (manager) => {
      // Remove old relationships
      await manager.createQueryBuilder()
        .delete()
        .from(DishProduct)
        .where("dishId = :dishId", { dishId })
        .execute();

      const dish = new Dish();
      dish.id = dishId;
      updateDish(dish, dto);
      await manager.save(Dish, dish);
    });

    return true;
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

type DishData = {
  name: string, description: string, products: DishProductDto[]
}

const createDish = (userId: number, data: DishData) => {
  const { description, name, products } = data
  const user = new User()
  user.id = userId
  const dish = new Dish()
  dish.name = name
  dish.description = description
  dish.user = user
  const dishProducts = createDishProducts(dish, products)
  dish.dishToProducts = dishProducts
  return dish
}

const updateDish = (dish: Dish, data: Partial<DishData>) => {
  if (data.products) {
    const dishProducts = createDishProducts(dish, data.products)
    dish.dishToProducts = dishProducts
  }
  if (data.name) {
    dish.name = data.name
  }
  if (data.description) {
    dish.description = data.description
  }
}

const createDishProducts = (dish: Dish, products: DishProductDto[]) => {
  return products.map(({ id, quantity, name }) => {
    const dishProduct = new DishProduct()

    dishProduct.dish = dish
    dishProduct.quantity = quantity
    const product = new Product
    product.id = id
    product.name = name
    dishProduct.product = product

    return dishProduct
  })
}

const transformDishProducts = (products: DishProduct[]) => {
  console.log(products.map(product => {
    console.log(product)
  }))
  return products.map(({ id, quantity, product }) => ({
    id: product.id, quantity, name: product.name
  }))
}

const transformDish = (dish: Dish) => {
  const { id, name, description, dishToProducts } = dish
  return {
    id, name, description, products: transformDishProducts(dishToProducts)
  }
}