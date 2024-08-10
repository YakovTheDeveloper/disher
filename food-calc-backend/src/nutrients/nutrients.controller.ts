import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NutrientsService } from './nutrients.service';
import { CreateNutrientDto } from './dto/create-nutrient.dto';
import { UpdateNutrientDto } from './dto/update-nutrient.dto';

@Controller('nutrients')
export class NutrientsController {
  constructor(private readonly nutrientsService: NutrientsService) {}

  @Post()
  create(@Body() createNutrientDto: CreateNutrientDto) {
    return this.nutrientsService.create(createNutrientDto);
  }

  @Get()
  findAll() {
    return this.nutrientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nutrientsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNutrientDto: UpdateNutrientDto) {
    return this.nutrientsService.update(+id, updateNutrientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nutrientsService.remove(+id);
  }
}
