import { Inject, Injectable } from '@nestjs/common';
import { CreateProductsNutrientDto } from './dto/create-products_nutrient.dto';
import { UpdateProductsNutrientDto } from './dto/update-products_nutrient.dto';
import { NUTRIENTS_REPOSITORY, PRODUCTS_NUTRIENTS_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { ProductsNutrient } from './entities/products_nutrient.entity';
import { Nutrient } from 'nutrients/entities/nutrient.entity';
import { Product } from 'products/entities/product.entity';

@Injectable()
export class ProductsNutrientsService {

  constructor(
    @Inject(NUTRIENTS_REPOSITORY)
    private nutrientsRepository: Repository<Nutrient>,
    @Inject(PRODUCTS_NUTRIENTS_REPOSITORY)
    private productsNutrientsRepositrory: Repository<ProductsNutrient>,
  ) { }


  async create(createProductsNutrientDto: CreateProductsNutrientDto, product: Product) {
    const nutrients = await this.nutrientsRepository.find()
    const nutrientsRecord = nutrients.reduce((record: Record<number, Nutrient>, nutrient) => {
      record[nutrient.id] = nutrient
      return record
    }, {})

    const productsNutrientsToAdd: ProductsNutrient[] = []

    const nutrientIdToQuantity = createProductsNutrientDto.nutrients
    for (const id in nutrientIdToQuantity) {
      const quantity = nutrientIdToQuantity[id]
      const nutrient = nutrientsRecord[id]
      productsNutrientsToAdd.push(this.productsNutrientsRepositrory.create({
        nutrient,
        product,
        quantity
      }))

    }

    await this.productsNutrientsRepositrory.save(productsNutrientsToAdd)
  }

  findAll() {
    return `This action returns all productsNutrients`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productsNutrient`;
  }

  update(id: number, updateProductsNutrientDto: UpdateProductsNutrientDto) {
    return `This action updates a #${id} productsNutrient`;
  }

  remove(id: number) {
    return `This action removes a #${id} productsNutrient`;
  }
}
