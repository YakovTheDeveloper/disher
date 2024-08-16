import { Product } from "products/entities/product.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class FoodCollectionProduct {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    quantity: number
}
