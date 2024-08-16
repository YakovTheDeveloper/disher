import { MenuCategory } from "common/types";
import { MenuProduct } from "menu_product/entities/menu_product.entity";
import { Product } from "products/entities/product.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "users/entities/user.entity";

@Entity()
export class FoodCollection {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 1000, nullable: true, default: '' })
    description: string;

    @Column()
    category: string

    @ManyToOne(() => User)
    user: User

    // @OneToMany(() => MenuProduct, menuProduct => menuProduct.menu)
    // menuToProducts: MenuProduct[];
}

