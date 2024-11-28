import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException, Query } from '@nestjs/common';
import { DishService } from './dish.service';
import { FoodCollectionController } from 'foodCollection/common/foodCollection.controller';
import { LocalAuthGuard } from 'resources/auth/auth.guard';
import { CreateFoodCollectionDto } from 'foodCollection/common/dto/create-foodCollection.dto';
import { UpdateFoodCollectionDto } from 'foodCollection/common/dto/update-foodCollection.dto';


@Controller('dish')
export class DishController {
  constructor(private readonly dishService: DishService) {
  }

  @UseGuards(LocalAuthGuard)
  @Get('products')
  async getDishProductData(@Query('dish_ids') dishIds: string, @Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    if (!dishIds) {
      throw new BadRequestException('No dish IDs provided');
    }
    const parsedDishIds: string[] = JSON.parse(dishIds);
    return await this.dishService.getDishProductData(userId, parsedDishIds);
  }

  @UseGuards(LocalAuthGuard)
  @Get()
  findAll(@Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    return this.dishService.findAll(userId);
  }

  @UseGuards(LocalAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateFoodCollectionDto) {
    return this.dishService.update(+id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dishService.remove(+id);
  }

  @UseGuards(LocalAuthGuard)
  @Post()
  async create(@Body() createDto: CreateFoodCollectionDto, @Req() request: Request) {
    const userId = request.user?.id
    if (userId == null) {
      throw new BadRequestException('No such user id');
    }
    const dish = await this.dishService.create(createDto, userId);
    return dish
  }


}
