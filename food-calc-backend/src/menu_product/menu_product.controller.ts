import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MenuProductService } from './menu_product.service';
import { CreateMenuProductDto } from './dto/create-menu_product.dto';
import { UpdateMenuProductDto } from './dto/update-menu_product.dto';

@Controller('menu-product')
export class MenuProductController {
  constructor(private readonly menuProductService: MenuProductService) {}

  @Post()
  create(@Body() createMenuProductDto: CreateMenuProductDto) {
    return this.menuProductService.create(createMenuProductDto);
  }

  @Get()
  findAll() {
    return this.menuProductService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.menuProductService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMenuProductDto: UpdateMenuProductDto) {
    return this.menuProductService.update(+id, updateMenuProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuProductService.remove(+id);
  }
}
