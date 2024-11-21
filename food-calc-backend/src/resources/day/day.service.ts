import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { Dish } from 'foodCollection/dish/dish.entity';
import { Day } from 'resources/day/entities/day.entity';
import { DayCategory } from 'resources/day/entities/day_category.entity';
import { DayCategoryDish } from 'resources/day/entities/day_category_dish.entity';
import { DAY_CATEGORY_DISH_REPOSITORY, DAY_CATEGORY_REPOSITORY, DAY_REPOSITORY, DISH_REPOSITORY } from 'constants/provide';
import { UpdateDayDto } from 'resources/day/dto/update-day.dto';
import { isEmpty, isNotEmpty } from 'lib/utils/isEmpty';

type DayCategoryPayload = { id?: number, name: string; dishIds: number[] }

function createCategoryDishes(data: {
  dishIds: number[],
  day: Day,
  category: DayCategory
}) {
  const { category, day, dishIds } = data
  const categories: DayCategoryDish[] = []
  for (const dishId of dishIds) {
    const dayCategoryDish = new DayCategoryDish();
    const dish = new Dish()
    dish.id = dishId
    dayCategoryDish.dayCategory = category
    dayCategoryDish.dish = dish
    dayCategoryDish.day = day
    categories.push(dayCategoryDish);
  }
  return categories
}

function createDayCategories(createPayload: DayCategoryPayload[], day: Day): DayCategory[] {
  const result = []
  for (const dayCategory of createPayload) {
    const category = new DayCategory();
    category.name = dayCategory.name;
    category.dayCategoryDishes = createCategoryDishes({
      dishIds: dayCategory.dishIds,
      category,
      day
    });
    category.day = day
    result.push(category);
  }
  return result
}

type UpdateObject = {
  categoiesToUpdateMapping: Record<string, DayCategoryPayload>
  categoriesToAdd: DayCategoryPayload[]
}

function updateDayCategories(updatePayload: DayCategoryPayload[], day: Day): Day {
  const mapping: UpdateObject = updatePayload.reduce((acc, category) => {
    if (category.id == null) {
      acc.categoriesToAdd.push(category)
      return acc
    }
    acc.categoiesToUpdateMapping[category.id] = category
    return acc
  }, {
    categoiesToUpdateMapping: {},
    categoriesToAdd: []
  })

  const oldCategories = day.dayCategories.map(({ id }) => id)
  const newCategories = Object.keys(mapping.categoiesToUpdateMapping).map(c => +c)
  const { productsRemoved } = getDishChanges(oldCategories, newCategories)

  if (isNotEmpty(productsRemoved)) {
    day.dayCategories = day.dayCategories.filter(category => !productsRemoved.includes(category.id))
  }

  if (isNotEmpty(mapping.categoriesToAdd)) {
    const newCategories = createDayCategories(mapping.categoriesToAdd, day)
    day.dayCategories = [...day.dayCategories, ...newCategories]
  }

  for (const dayCategory of day.dayCategories) {
    const { id } = dayCategory
    const updatePayload = mapping.categoiesToUpdateMapping[id]
    if (!updatePayload) continue
    const { dishIds, name } = updatePayload
    dayCategory.name = name


    updateDayCategoriesDishes(dayCategory, dishIds, day)
  }


  return day
}

function updateDayCategoriesDishes(dayCategory: DayCategory, dishIds: number[], day: Day) {

  const oldDishes = dayCategory.dayCategoryDishes.map(categoryDish => categoryDish.dish.id)
  const { productsCreated, productsRemoved } = getDishChanges(oldDishes, dishIds)

  if (isNotEmpty(productsRemoved)) {
    dayCategory.dayCategoryDishes = dayCategory.dayCategoryDishes.filter(categoryDish => !productsRemoved.includes(categoryDish.dish.id))
  }

  if (isNotEmpty(productsCreated)) {
    const newDishes = createCategoryDishes({
      dishIds: productsCreated,
      category: dayCategory,
      day
    })
    dayCategory.dayCategoryDishes = [...dayCategory.dayCategoryDishes, ...newDishes]
  }
}

export function getDishChanges(
  oldState: number[],
  newChanges: number[]
) {
  const oldStateSet = new Set(oldState);
  const newChangesSet = new Set(newChanges);

  const productsRemoved = oldState.filter(item => !newChangesSet.has(item));
  const productsCreated = newChanges.filter(item => !oldStateSet.has(item));

  return {
    productsRemoved,
    productsCreated,
  };
}



@Injectable()
export class DayService {
  constructor(
    @Inject(DAY_REPOSITORY)
    private dayRepository: Repository<Day>,

    @Inject(DISH_REPOSITORY)
    private dishRepository: Repository<Dish>,

    @Inject(DAY_CATEGORY_REPOSITORY)
    private dayCategoryRepository: Repository<DayCategory>,

    @Inject(DAY_CATEGORY_DISH_REPOSITORY)
    private dayCategoryDishRepository: Repository<DayCategoryDish>,
  ) { }

  async createDay(dayName: string, dayContent: DayCategoryPayload[]) {
    let day = new Day();
    day.name = dayName;
    day.dayCategories = createDayCategories(dayContent, day);
    const newDay = await this.dayRepository.save(day)

    return {
      result: {
        name: newDay.name,
        id: newDay.id
      }
    }
  }

  findAll(): Promise<Day[]> {
    return this.dayRepository.find({ relations: ['menus'] });
  }

  async update(
    dayId: number,
    updatedDayName: string,
    updatedDayContent: { id?: number; name: string; dishIds: number[] }[]
  ) {
    // Fetch the existing Day with its categories and their relationships
    const existingDay = await this.dayRepository.findOne({
      where: { id: dayId },
      relations: ['dayCategories', 'dayCategories.dayCategoryDishes', 'dayCategories.dayCategoryDishes.dish'],
    });

    if (!existingDay) {
      throw new Error(`Day with ID ${dayId} not found`);
    }

    existingDay.name = updatedDayName;


    // const categoriesToAdd = updatedDayContent.filter(content => content.id == null)
    // const entitiesCategoriesToAdd = createDayCategories(categoriesToAdd, existingDay)

    updateDayCategories(updatedDayContent, existingDay)

    await this.dayRepository.save(existingDay);
    await this.dayCategoryDishRepository
      .createQueryBuilder()
      .delete()
      .where('dayId IS NULL')
      .execute();
    await this.dayCategoryRepository
      .createQueryBuilder()
      .delete()
      .where('dayId IS NULL')
      .execute();
    // await this.dayCategoryDishRepository.remove()

    return true






  }


}
