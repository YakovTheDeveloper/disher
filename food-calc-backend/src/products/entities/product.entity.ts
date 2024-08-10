import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";


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
}
