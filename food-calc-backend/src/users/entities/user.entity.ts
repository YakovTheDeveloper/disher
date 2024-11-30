import { Dish } from 'foodCollection/dish/dish.entity';
import { Day } from 'resources/day/entities/day.entity';
import { Entity, Column, PrimaryGeneratedColumn, Unique, Index, OneToMany } from 'typeorm';
import { UserNorm } from 'user_norm/entities/user_norm.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ length: 500 })
    login: string;

    @Column({ length: 500 })
    password: string;

    @OneToMany(() => Day, day => day.user)
    days: Day[];

    @OneToMany(() => Dish, dish => dish.user)
    dishes: Dish[];

    @OneToMany(() => UserNorm, norm => norm.user)
    norms: UserNorm[];
}