import { Dish } from 'foodCollection/dish/dish.entity';
import { Menu } from 'foodCollection/menu/menu.entity';
import { Day } from 'resources/day/entities/day.entity';
import { DayCategory } from 'resources/day/entities/day_category.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany, JoinColumn } from 'typeorm';


@Entity()
export class DayCategoryDish {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Day, day => day.dayCategoryDishes)
    @JoinColumn({ name: 'dayId' })
    day: Day;

    @ManyToOne(() => DayCategory, dayCategory => dayCategory.dayCategoryDishes, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'dayCategoryId' })
    dayCategory: DayCategory;

    @ManyToOne(() => Dish, dish => dish.dayCategoryDishes)
    @JoinColumn({ name: 'dishId' })
    dish: Dish;

    @Column({ nullable: true })
    position: number;

}
