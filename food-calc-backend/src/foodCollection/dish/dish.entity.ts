import { Exclude, Transform } from "class-transformer";
import { DishProduct } from "foodCollection/dish/dishProduct/dishProduct.entity";
import { DayCategoryDish } from "resources/day/entities/day_category_dish.entity";
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "users/entities/user.entity";



@Entity()
export class Dish {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 1000, nullable: true, default: '' })
    description: string;

    @OneToMany(() => DishProduct, dishProduct => dishProduct.dish, {
        cascade: true,
        eager: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    dishToProducts: DishProduct[];

    @OneToMany(() => DayCategoryDish, dayCategoryDish => dayCategoryDish.dish, {
        cascade: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    dayCategoryDishes: DayCategoryDish[];

    @ManyToOne(() => User)
    user: User
}


