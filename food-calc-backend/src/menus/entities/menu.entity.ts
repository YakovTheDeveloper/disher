import { Product } from "products/entities/product.entity";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "users/entities/user.entity";

@Entity()
export class Menu {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    name: string;

    @Column({ length: 1000, nullable: true, default: '' })
    description: string;


    // @Column({ type: 'int' })
    // quantity: number;

    @ManyToOne(() => User)
    user: User

    // @ManyToMany(() => Product)
    // products: Product[]

}




// @Column({ length: 100 })
// name: string;

// @Column({ length: 1000, nullable: true, default: '' })
// description: string;