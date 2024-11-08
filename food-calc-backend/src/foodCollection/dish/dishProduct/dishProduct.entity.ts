import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { FoodCollectionProduct } from "foodCollection/common/entities/foodCollectionProduct.entity"
import { Product } from "products/entities/product.entity"
import { Dish } from "foodCollection/dish/dish.entity"

@Entity()
export class DishProduct extends FoodCollectionProduct {
    @ManyToOne(() => Dish, dish => dish.menuToProducts, { onDelete: 'CASCADE' })
    dish: Dish

    @ManyToOne(() => Product, product => product.dishToProducts)
    product: Product
}
