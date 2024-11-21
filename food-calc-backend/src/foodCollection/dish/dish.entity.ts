import { FoodCollection } from "foodCollection/common/entities/foodCollection.entity";
import { DishProduct } from "foodCollection/dish/dishProduct/dishProduct.entity";
import { DayCategoryDish } from "resources/day/entities/day_category_dish.entity";
import { Entity, OneToMany } from "typeorm";



@Entity()
export class Dish extends FoodCollection {
    @OneToMany(() => DishProduct, dishProduct => dishProduct.dish)
    menuToProducts: DishProduct[];

    @OneToMany(() => DayCategoryDish, dayCategoryDish => dayCategoryDish.dish)
    dayCategoryDishes: DayCategoryDish[];
}


