
// import { Menu } from "foodCollection/common/entities/menu.entity";
import { Product } from "products/entities/product.entity";
import { Column, Entity, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class MenuProduct {

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    quantity: number

    @ManyToOne(() => Product, product => product.menuToProducts)
    product: Product

    // @ManyToOne(() => Menu, menu => menu.menuToProducts, { onDelete: 'CASCADE' })
    // menu: Menu
}

