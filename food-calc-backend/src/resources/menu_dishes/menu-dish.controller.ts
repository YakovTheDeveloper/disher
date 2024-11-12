import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common';
import { Dish } from 'foodCollection/dish/dish.entity';
import { Menu } from 'foodCollection/menu/menu.entity';
import { UpdateDishDto } from 'resources/menu_dishes/menu-dish.dto';
import { MenuDish } from 'resources/menu_dishes/menu-dish.entity';
import { MenuDishService } from 'resources/menu_dishes/menu-dish.service';



@Controller('menu-dishes')
export class MenuDishController {
    constructor(private readonly menuDishService: MenuDishService) { }

    @Post()
    async addDishToMenu(
        // @Param('menuId') menuId: number,
        @Body() dto: UpdateDishDto,
    ) {
        return this.menuDishService.addDishesToMenu(dto.menuId, dto.dishIds);
    }

    @Delete(':menuId/dishes/:dishId')
    async removeDishFromMenu(
        @Param('menuId') menuId: number,
        @Param('dishId') dishId: number,
    ): Promise<void> {
        return this.menuDishService.removeDishFromMenu(menuId, dishId);
    }

    @Get('menu/:menuId')
    async getDishesForMenu(@Param('menuId') menuId: number): Promise<Dish[]> {
        return this.menuDishService.getDishesForMenu(menuId);
    }

    @Get('dish/:dishId')
    async getMenusForDish(@Param('dishId') dishId: number): Promise<Menu[]> {
        return this.menuDishService.getMenusForDish(dishId);
    }
}
