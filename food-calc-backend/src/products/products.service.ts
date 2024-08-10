import { Inject, Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {  PRODUCTS_REPOSITORY } from 'constants/provide';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductsNutrient } from 'products_nutrients/entities/products_nutrient.entity';
import { Nutrient } from 'nutrients/entities/nutrient.entity';
import { ProductsNutrientsService } from 'products_nutrients/products_nutrients.service';
import { CreateProductsNutrientDto } from 'products_nutrients/dto/create-products_nutrient.dto';

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

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
