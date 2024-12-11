import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'users/entities/user.entity';

export enum NutrientUnits {
    g = 'g',
    mg = 'mg',
    μg = 'μg',
    kcal = 'kcal',
}

@Entity()
export class UserNorm {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, user => user.norms)
    user: User;

    @Column({ type: 'float', nullable: false })
    protein: number;

    @Column({ type: 'float', nullable: false })
    fats: number;

    @Column({ type: 'float', nullable: false })
    carbohydrates: number;

    @Column({ type: 'float', nullable: false })
    fiber: number;

    @Column({ type: 'float', nullable: false })
    energy: number;

    @Column({ type: 'float', nullable: false })
    water: number;

    @Column({ type: 'float', nullable: false })
    iron: number;

    @Column({ type: 'float', nullable: false })
    magnesium: number;

    @Column({ type: 'float', nullable: false })
    phosphorus: number;

    @Column({ type: 'float', nullable: false })
    potassium: number;

    @Column({ type: 'float', nullable: false })
    sodium: number;

    @Column({ type: 'float', nullable: false })
    zinc: number;

    @Column({ type: 'float', nullable: false })
    copper: number;

    @Column({ type: 'float', nullable: false })
    calcium: number;

    @Column({ type: 'float', nullable: false })
    manganese: number;

    @Column({ type: 'float', nullable: false })
    selenium: number;

    @Column({ type: 'float', nullable: false })
    iodine: number;

    @Column({ type: 'float', nullable: false })
    vitaminA: number;

    @Column({ type: 'float', nullable: false })
    vitaminB1: number;

    @Column({ type: 'float', nullable: false })
    vitaminB2: number;

    @Column({ type: 'float', nullable: false })
    vitaminB3: number;

    @Column({ type: 'float', nullable: false })
    vitaminB4: number;

    @Column({ type: 'float', nullable: false })
    vitaminB5: number;

    @Column({ type: 'float', nullable: false })
    vitaminB6: number;

    @Column({ type: 'float', nullable: false })
    vitaminB9: number;

    @Column({ type: 'float', nullable: false })
    vitaminB12: number;

    @Column({ type: 'float', nullable: false })
    vitaminC: number;

    @Column({ type: 'float', nullable: false })
    vitaminD: number;

    @Column({ type: 'float', nullable: false })
    vitaminE: number;

    @Column({ type: 'float', nullable: false })
    vitaminK: number;

    @Column({ type: 'float', nullable: false })
    betaCarotene: number;

    @Column({ type: 'float', nullable: false })
    alphaCarotene: number;
}
