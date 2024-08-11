import { MenuProduct } from "menu_product/entities/menu_product.entity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";


@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 100, nullable: true, default: '' })
    nameRu: string;

    @Column({ length: 1000, nullable: true, default: '' })
    description: string;

    @Column({ length: 1000, nullable: true, default: '' })
    descriptionRu: string;

    @OneToMany(() => MenuProduct, menuProduct => menuProduct.product)
    public menuToProducts: MenuProduct[];
}
