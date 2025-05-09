import {
  IdToQuantity,
  ProductIdToNutrientsMap,
} from 'common/types';
import { PRODUCTS_REPOSITORY } from 'constants/provide';
import {
  CreateProductsNutrientDto,
} from 'products_nutrients/dto/create-products_nutrient.dto';
import {
  ProductsNutrientsService,
} from 'products_nutrients/products_nutrients.service';
import { Repository } from 'typeorm';

import {
  Inject,
  Injectable,
} from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {

  constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private productsRepository: Repository<Product>,
    @Inject(ProductsNutrientsService)
    private productsNutrientsService: ProductsNutrientsService,
  ) { }

  async create(createProductDto: CreateProductDto) {
    const savedProduct = await this.productsRepository.save(createProductDto)

    const productsNutrientsDto = new CreateProductsNutrientDto()
    productsNutrientsDto.nutrients = createProductDto.nutrients

    this.productsNutrientsService.create(productsNutrientsDto, savedProduct)

    return savedProduct
  }

  async findAll() {
    const products = await this.productsRepository.find({ relations: ['productNutrients', 'productNutrients.nutrient'] })
    return products.map(({ id, nameRu, portions, productNutrients }) => {
      // console.log("portions", portions)
      return {
        id,
        name: nameRu,
        portions: JSON.parse(portions || "[]") || [],
        nutrients: productNutrients.reduce((nutrientAcc, productNutrient) => {
          nutrientAcc[productNutrient.nutrient.id] = productNutrient.quantity;
          return nutrientAcc;
        }, {})
      }
    })
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  async findProductNutrients(ids: string) {
    const idArray = ids.split(',').map(id => id.trim());

    let productWithNutrients = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.id IN (:...idArray)', { idArray })
      .leftJoin('product.productNutrients', 'productNutrients')
      .leftJoin('productNutrients.nutrient', 'nutrient')
      .select(['product.id', 'product.portions', 'productNutrients.quantity', 'nutrient.id'])
      .getMany();

    // let productWithNutrients = await this.productsRepository
    //   .createQueryBuilder('product')
    //   .where('product.id IN (:...idArray)', { idArray })
    //   .leftJoin('product.productNutrients', 'productNutrients')
    //   .leftJoin('productNutrients.nutrient', 'nutrient')
    //   .select(['product.id', 'productNutrients', 'nutrient.id'])
    //   .getMany();

    const result = []

    productWithNutrients.forEach(({ id, productNutrients, portions = "[]" }) => {
      console.log("portions", portions)
      const nutrients: IdToQuantity = {}
      const portionsParsed = JSON.parse(portions || "[]")

      productNutrients.forEach(({ nutrient, quantity }) => nutrients[nutrient.id] = quantity)

      result.push({
        id,
        nutrients,
        portions: portionsParsed
      })
    })

    return result
    // return {
    //   nutrients: productIdToNutrientsMap,
    //   portions: productIdToPortion,
    // }
  }

  async findRich(nutrientId: string) {
    // Nutrient daily norms
    const nutrients = {
      protein: 51,
      fats: 70,
      carbohydrates: 275,
      sugar: 50,
      starch: 30,
      fiber: 25,
      energy: 2000,
      water: 2000,
      iron: 18,
      calcium: 1000,
      magnesium: 350,
      phosphorus: 700,
      potassium: 3500,
      sodium: 2300,
      zinc: 15,
      copper: 900,
      manganese: 2.3,
      selenium: 55,
      iodine: 150,
      vitaminA: 900,
      vitaminB1: 1.2,
      vitaminB2: 1.3,
      vitaminB3: 16,
      vitaminB4: 550,
      vitaminB5: 5,
      vitaminB6: 2,
      vitaminB7: 1,
      vitaminB9: 400,
      vitaminB12: 2.4,
      vitaminC: 90,
      vitaminD: 20,
      vitaminE: 15,
      vitaminK: 120,
      betaCarotene: 3000,
      alphaCarotene: 600,
    };

    // Retrieve the daily norm for the given nutrientId
    const dailyNorm = nutrients[nutrientId];

    if (!dailyNorm) {
      throw new Error(`Nutrient with ID ${nutrientId} not found in daily norms.`);
    }
    const threshold = dailyNorm * 0.2;
    // Fetch products using a QueryBuilder
    const products = await this.productsRepository
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.productNutrients', 'productNutrient')
      .innerJoinAndSelect('productNutrient.nutrient', 'nutrient')
      .where('nutrient.name = :nutrientId', { nutrientId })
      .andWhere('productNutrient.quantity > :threshold', { threshold })
      .getMany();

    return products
      .sort((a, b) => b.productNutrients[0].quantity - a.productNutrients[0].quantity)
      .map(({ name, productNutrients, id }) => ({
        id,
        name,
        nutrients: productNutrients
          .reduce((acc, { nutrient, quantity }) => {
            acc[nutrient.id] = quantity
            return acc
          }, {})
      }));
  }

  // async findOneWithNutrients(id: number) {
  //   let productWithNutrients = await this.productsRepository
  //     .createQueryBuilder('product')
  //     .leftJoinAndSelect('product.productNutrients', 'productNutrients')
  //     .where('product.id = :id', { id })
  //     .getOne();

  //   const nutrientsIdToValueMap: IdToQuantity = {}

  //   productWithNutrients.productNutrients.forEach(({ id, quantity }) => {
  //     nutrientsIdToValueMap[id] = quantity
  //   })

  //   const { description, descriptionRu, productNutrients, ...mainData } = productWithNutrients

  //   return {
  //     ...mainData,
  //     productNutrients: nutrientsIdToValueMap
  //   }
  // }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { portions = '', name = '' } = updateProductDto

    const [product] = await this.productsRepository.find({ where: { id } })
    if (!product) return

    if (portions) product.portions = JSON.stringify(portions)
    if (name) product.nameRu = name
    // if (name) {
    //   product.nameRu = name
    // }
    const result = await this.productsRepository.save(product)

    return result
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}

