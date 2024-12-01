import { Day } from 'resources/day/entities/day.entity';
import { DayCategoryDish } from 'resources/day/entities/day_category_dish.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, OneToMany } from 'typeorm';


@Entity()
export class DayCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string

    @ManyToOne(() => Day, day => day.dayCategories, {
        onDelete: 'CASCADE', // Remove this DayCategory if the related Day is deleted
        onUpdate: 'CASCADE', // Update the reference if Day's primary key changes
    })
    day: Day;

    @OneToMany(() => DayCategoryDish, dayCategoryDish => dayCategoryDish.dayCategory, { cascade: true, onDelete: 'CASCADE', eager: true })
    dayCategoryDishes: DayCategoryDish[];

    @Column({ nullable: true })
    position: number;
}
