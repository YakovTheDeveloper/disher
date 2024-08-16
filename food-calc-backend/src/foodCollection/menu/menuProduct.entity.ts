import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm"
import { Menu } from "./menu.entity"
import { FoodCollectionProduct } from "foodCollection/common/entities/foodCollectionProduct.entity"
import { Product } from "products/entities/product.entity"

@Entity()
export class MenuProduct extends FoodCollectionProduct {
    @ManyToOne(() => Menu, menu => menu.menuToProducts, { onDelete: 'CASCADE' })
    menu: Menu

    @ManyToOne(() => Product, product => product.menuToProducts)
    product: Product
}
