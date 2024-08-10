import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductsNutrientsService } from './products_nutrients.service';
import { CreateProductsNutrientDto } from './dto/create-products_nutrient.dto';
import { UpdateProductsNutrientDto } from './dto/update-products_nutrient.dto';
import { CreateProductDto } from 'products/dto/create-product.dto';
import { Product } from 'products/entities/product.entity';

@Controller('products-nutrients')
export class ProductsNutrientsController {
  constructor(private readonly productsNutrientsService: ProductsNutrientsService) {}

  @Post()
  create(@Body() createProductsNutrientDto: CreateProductsNutrientDto) {
    // return this.productsNutrientsService.create(createProductsNutrientDto);
  }

  @Get()
  findAll() {
    return this.productsNutrientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsNutrientsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductsNutrientDto: UpdateProductsNutrientDto) {
    return this.productsNutrientsService.update(+id, updateProductsNutrientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsNutrientsService.remove(+id);
  }
}
