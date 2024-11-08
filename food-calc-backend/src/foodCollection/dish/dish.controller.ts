import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DishService } from './dish.service';
import { FoodCollectionController } from 'foodCollection/common/foodCollection.controller';


@Controller('dish')
export class DishController extends FoodCollectionController {
  constructor(dishService: DishService) {
    super(dishService)
  }
}
