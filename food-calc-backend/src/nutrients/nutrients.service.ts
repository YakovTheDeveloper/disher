import { Injectable } from '@nestjs/common';
import { CreateNutrientDto } from './dto/create-nutrient.dto';
import { UpdateNutrientDto } from './dto/update-nutrient.dto';

@Injectable()
export class NutrientsService {
  create(createNutrientDto: CreateNutrientDto) {
    return 'This action adds a new nutrient';
  }

  findAll() {
    return `This action returns all nutrients`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nutrient`;
  }

  update(id: number, updateNutrientDto: UpdateNutrientDto) {
    return `This action updates a #${id} nutrient`;
  }

  remove(id: number) {
    return `This action removes a #${id} nutrient`;
  }
}
