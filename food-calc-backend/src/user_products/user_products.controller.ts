import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserProductsService } from './user_products.service';
import { CreateUserProductDto } from './dto/create-user_product.dto';
import { UpdateUserProductDto } from './dto/update-user_product.dto';

@Controller('user-products')
export class UserProductsController {
  constructor(private readonly userProductsService: UserProductsService) {}

  @Post()
  create(@Body() createUserProductDto: CreateUserProductDto) {
    return this.userProductsService.create(createUserProductDto);
  }

  @Get()
  findAll() {
    return this.userProductsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userProductsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserProductDto: UpdateUserProductDto) {
    return this.userProductsService.update(+id, updateUserProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userProductsService.remove(+id);
  }
}
