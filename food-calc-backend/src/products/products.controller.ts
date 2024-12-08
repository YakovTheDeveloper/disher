import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { wait } from 'lib/utils/wait';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  async findAll(@Query() query) {
    const result = await this.productsService.findAll();
    return {
      result
    }
  }

  // @Get(':id')
  // findOne(@Param('id') id: string, @Query() query) {
  //   if (query?.with_nutrients != null) {
  //     return this.productsService.findOneWithNutrients(+id);
  //   }
  //   return this.productsService.findOne(+id);
  // }

  @Get('nutrients')
  async findProductNutrients(@Query() query: { ids: string }) {
    if (!query?.ids) {
      return
    }
    const result = await this.productsService.findProductNutrients(query.ids)
    return { result };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}
