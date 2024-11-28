import { FoodCollection } from "foodCollection/common/entities/foodCollection.entity";
import { DishProduct } from "foodCollection/dish/dishProduct/dishProduct.entity";
import { DayCategoryDish } from "resources/day/entities/day_category_dish.entity";
import { Entity, ManyToOne, OneToMany } from "typeorm";
import { User } from "users/entities/user.entity";



@Entity()
export class Dish extends FoodCollection {
    @OneToMany(() => DishProduct, dishProduct => dishProduct.dish)
    dishToProducts: DishProduct[];

    @OneToMany(() => DayCategoryDish, dayCategoryDish => dayCategoryDish.dish)
    dayCategoryDishes: DayCategoryDish[];

    @ManyToOne(() => User)
    user: User
}


