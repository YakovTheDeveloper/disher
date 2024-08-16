import { FoodCollectionProduct } from "foodCollection/common/entities/foodCollectionProduct.entity"
import { Product } from "products/entities/product.entity"
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { Dish } from "./dish.entity"

@Entity()
export class DishProduct extends FoodCollectionProduct {
    @ManyToOne(() => Dish, dish => dish.menuToProducts, { onDelete: 'CASCADE' })
    dish: Dish

    @ManyToOne(() => Product, product => product.dishToProducts)
    product: Product
}
