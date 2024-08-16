import { Entity, OneToMany } from "typeorm";
import { FoodCollectionProduct } from "foodCollection/common/entities/foodCollectionProduct.entity";
import { FoodCollection } from "foodCollection/common/entities/foodCollection.entity";
import { MenuProduct } from "./menuProduct.entity";

@Entity()
export class Menu extends FoodCollection {
    @OneToMany(() => MenuProduct, menuProduct => menuProduct.menu)
    menuToProducts: MenuProduct[];
}


