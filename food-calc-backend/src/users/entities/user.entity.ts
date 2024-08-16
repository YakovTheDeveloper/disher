import { Entity, Column, PrimaryGeneratedColumn, Unique, Index } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ length: 500 })
    login: string;

    @Column({ length: 500 })
    password: string;
}