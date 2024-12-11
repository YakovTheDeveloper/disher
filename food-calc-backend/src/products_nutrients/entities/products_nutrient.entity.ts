import { Nutrient } from "nutrients/entities/nutrient.entity";
import { Product } from "products/entities/product.entity";
import { PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, Entity, ManyToOne } from "typeorm";
import { User } from "users/entities/user.entity";

@Entity()
export class ProductsNutrient {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal') // Use 'decimal' for decimal numbers
    quantity: number;


    @ManyToOne(() => Product, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    product: Product

    @ManyToOne(() => Nutrient)
    nutrient: Nutrient

}
