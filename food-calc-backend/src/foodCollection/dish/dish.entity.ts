import { FoodCollection } from "foodCollection/common/entities/foodCollection.entity";
import { Entity, OneToMany } from "typeorm";
import { DishProduct } from "./dishProduct.entity";


@Entity()
export class Dish extends FoodCollection {
    @OneToMany(() => DishProduct, dishProduct => dishProduct.dish)
    menuToProducts: DishProduct[];
}


