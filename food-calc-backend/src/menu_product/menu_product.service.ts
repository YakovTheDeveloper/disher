import { Injectable } from '@nestjs/common';
import { CreateMenuProductDto } from './dto/create-menu_product.dto';
import { UpdateMenuProductDto } from './dto/update-menu_product.dto';

@Injectable()
export class MenuProductService {
  create(createMenuProductDto: CreateMenuProductDto) {
    return 'This action adds a new menuProduct';
  }

  findAll() {
    return `This action returns all menuProduct`;
  }

  findOne(id: number) {
    return `This action returns a #${id} menuProduct`;
  }

  update(id: number, updateMenuProductDto: UpdateMenuProductDto) {
    return `This action updates a #${id} menuProduct`;
  }

  remove(id: number) {
    return `This action removes a #${id} menuProduct`;
  }
}
