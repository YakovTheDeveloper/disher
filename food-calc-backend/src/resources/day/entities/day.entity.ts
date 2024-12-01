import { DayCategory } from 'resources/day/entities/day_category.entity';
import { DayCategoryDish } from 'resources/day/entities/day_category_dish.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany, ManyToOne } from 'typeorm';
import { User } from 'users/entities/user.entity';


@Entity()
export class Day {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.days)
    user: User;
    
    @Column()
    name: string

    @OneToMany(() => DayCategory, dayCategory => dayCategory.day, { cascade: true, onDelete: 'CASCADE', eager: true })
    dayCategories: DayCategory[];
}
