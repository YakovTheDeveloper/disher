import { Nutrient } from "nutrients/entities/nutrient.entity";
import { Product } from "products/entities/product.entity";
import { PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Entity, ManyToOne } from "typeorm";
import { User } from "users/entities/user.entity";

@Entity()
export class ProductsNutrient {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    quantity: number;

    @ManyToOne(() => Product)
    product: Product

    @ManyToOne(() => Nutrient)
    nutrient: Nutrient

}
