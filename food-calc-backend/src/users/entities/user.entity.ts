import { Day } from 'resources/day/entities/day.entity';
import { Entity, Column, PrimaryGeneratedColumn, Unique, Index, OneToMany } from 'typeorm';

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
}