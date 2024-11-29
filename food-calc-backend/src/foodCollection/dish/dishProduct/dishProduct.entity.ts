import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { FoodCollectionProduct } from "foodCollection/common/entities/foodCollectionProduct.entity"
import { Product } from "products/entities/product.entity"
import { Dish } from "foodCollection/dish/dish.entity"
import { Exclude } from "class-transformer"

@Entity()
export class DishProduct {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    quantity: number

    @ManyToOne(() => Dish, dish => dish.dishToProducts, { onDelete: 'CASCADE' })
    dish: Dish

    @ManyToOne(() => Product, product => product.dishToProducts, { eager: true })
    product: Product
}
