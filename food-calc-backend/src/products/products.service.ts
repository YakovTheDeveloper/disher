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
    const products = await this.productsRepository.find()
    return products.map(({ description, descriptionRu, ...baseData }) => ({ ...baseData }))
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
      .select(['product.id', 'productNutrients.quantity', 'nutrient.id'])
      .getMany();

    // let productWithNutrients = await this.productsRepository
    //   .createQueryBuilder('product')
    //   .where('product.id IN (:...idArray)', { idArray })
    //   .leftJoin('product.productNutrients', 'productNutrients')
    //   .leftJoin('productNutrients.nutrient', 'nutrient')
    //   .select(['product.id', 'productNutrients', 'nutrient.id'])
    //   .getMany();

    const productIdToNutrientsMap: ProductIdToNutrientsMap = {}

    productWithNutrients.forEach(({ id, productNutrients }) => {
      const nutrients: IdToQuantity = {}
      productNutrients.forEach(({ nutrient, quantity }) => nutrients[nutrient.id] = quantity)
      productIdToNutrientsMap[id] = nutrients
    })

    return productIdToNutrientsMap
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

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
