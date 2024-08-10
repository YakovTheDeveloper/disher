import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Nutrient {
    @PrimaryColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 100 })
    displayName: string;

    @Column({ length: 100 })
    nameRu: string;

    @Column({ length: 20 })
    unit: string;
}
