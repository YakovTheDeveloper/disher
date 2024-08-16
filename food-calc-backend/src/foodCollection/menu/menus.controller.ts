import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MenusService } from './menus.service';
import { FoodCollectionController } from 'foodCollection/common/foodCollection.controller';


@Controller('menus')
export class MenusController extends FoodCollectionController {
  constructor(menusService: MenusService) {
    super(menusService)
  }
}
