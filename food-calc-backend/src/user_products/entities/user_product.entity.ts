import { Column, PrimaryGeneratedColumn, } from "typeorm";

export class UserProduct {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 500 })
    login: string;
}
