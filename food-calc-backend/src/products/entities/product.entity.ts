import { DishProduct } from 'foodCollection/dish/dishProduct/dishProduct.entity';
import {
  ProductsNutrient,
} from 'products_nutrients/entities/products_nutrient.entity';
import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ length: 200, nullable: true, default: '' })
  nameRu: string;

  @Column({ length: 1000, nullable: true, default: '' })
  description: string;

  @Column({ nullable: true, default: JSON.stringify(''), type: 'json' })
  portions: string;
  @Column({ length: 1000, nullable: true, default: '' })
  descriptionRu: string;

  @OneToMany(() => DishProduct, dishProduct => dishProduct.product)
  dishToProducts: DishProduct[];

  @OneToMany(() => ProductsNutrient, productNutrient => productNutrient.product, { cascade: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  productNutrients: ProductsNutrient[]
}


