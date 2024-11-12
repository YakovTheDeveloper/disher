import { Inject, Injectable } from '@nestjs/common';
import { DISH_REPOSITORY, MENU_DISH_REPOSITORY, MENU_REPOSITORY } from 'constants/provide';
import { Dish } from 'foodCollection/dish/dish.entity';
import { Menu } from 'foodCollection/menu/menu.entity';
import { MenuDish } from 'resources/menu_dishes/menu-dish.entity';

import { In, Repository } from 'typeorm';

@Injectable()
export class MenuDishService {
    constructor(
        @Inject(MENU_DISH_REPOSITORY)
        private menuDishRepository: Repository<MenuDish>,

        @Inject(MENU_REPOSITORY)
        private menuRepository: Repository<Menu>,

        @Inject(DISH_REPOSITORY)
        private dishRepository: Repository<Dish>,
    ) { }

    async addDishesToMenu(menuId: number, dishIds: number[]): Promise<MenuDish[]> {
        // Fetch the menu
        const menu = await this.menuRepository.findOneBy({ id: menuId });
        if (!menu) {
            throw new Error('Menu not found');
        }

        // Fetch existing associations for the menu, making sure to load the 'dish' relation
        const existingMenuDishes = await this.menuDishRepository.find({
            where: { menu: { id: menuId } },
            relations: ['dish'], // Ensure the 'dish' relation is loaded
        });

        // Find existing dish IDs associated with this menu
        const existingDishIds = existingMenuDishes
            .filter(menuDish => menuDish.dish) // Ensure 'dish' is not undefined
            .map(menuDish => menuDish.dish.id);

        // Identify dish IDs to be added and dish IDs to be removed
        const dishIdsToAdd = dishIds.filter(id => !existingDishIds.includes(id));
        const dishIdsToRemove = existingDishIds.filter(id => !dishIds.includes(id));

        // Remove any associations not in the provided dishIds array
        if (dishIdsToRemove.length > 0) {
            await this.menuDishRepository.delete({
                menu: { id: menuId },
                dish: { id: In(dishIdsToRemove) }, // Use In for multiple ids
            });
        }

        // Add new associations for dishIds that don’t already exist
        const newMenuDishes = dishIdsToAdd.map(dishId => {
            return this.menuDishRepository.create({
                menu,
                dish: { id: dishId } as Dish, // Using partial object for relation
            });
        });

        // Save new associations in a single transaction
        await this.menuDishRepository.save(newMenuDishes);

        // Return the updated list of associations for this menu
        return this.menuDishRepository.find({
            where: { menu: { id: menuId } },
            relations: ['dish'],
        });
    }


    async removeDishFromMenu(menuId: number, dishId: number): Promise<void> {
        await this.menuDishRepository.delete({ menu: { id: menuId }, dish: { id: dishId } });
    }

    async getDishesForMenu(menuId: number): Promise<Dish[]> {
        const menuDishes = await this.menuDishRepository.find({
            where: { menu: { id: menuId } },
            relations: ['dish'],
        });
        return menuDishes.map((menuDish) => menuDish.dish);
    }

    async getMenusForDish(dishId: number): Promise<Menu[]> {
        const dishMenus = await this.menuDishRepository.find({
            where: { dish: { id: dishId } },
            relations: ['menu'],
        });
        return dishMenus.map((menuDish) => menuDish.menu);
    }
}
