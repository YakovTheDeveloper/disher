import { FoodCollection } from "foodCollection/common/entities/foodCollection.entity";
import { DishProduct } from "foodCollection/dish/dishProduct/dishProduct.entity";
import { Entity, OneToMany } from "typeorm";



@Entity()
export class Dish extends FoodCollection {
    @OneToMany(() => DishProduct, dishProduct => dishProduct.dish)
    menuToProducts: DishProduct[];
}


