import { Inject, Injectable } from '@nestjs/common';

import { Repository } from 'typeorm';

import { Dish } from 'foodCollection/dish/dish.entity';
import { Day } from 'resources/day/entities/day.entity';
import { DayCategory } from 'resources/day/entities/day_category.entity';
import { DayCategoryDish } from 'resources/day/entities/day_category_dish.entity';
import { DAY_CATEGORY_DISH_REPOSITORY, DAY_CATEGORY_REPOSITORY, DAY_REPOSITORY, DISH_REPOSITORY } from 'constants/provide';
import { UpdateDayDto } from 'resources/day/dto/update-day.dto';
import { isEmpty, isNotEmpty } from 'lib/utils/isEmpty';
import { User } from 'users/entities/user.entity';
import { CreateDayDto, DayCategoryDto } from 'resources/day/dto/create-day.dto';

type DayCategoryDishesPayload = {
  id: number,
  position: number
}

type DayCategoryPayload = {
  id?: number, name: string; dishes: DayCategoryDishesPayload[], position: number
}

function createCategoryDishes(data: {
  dishes: DayCategoryDishesPayload[],
  day: Day,
  category: DayCategory
}) {
  const { category, day, dishes } = data
  const categories: DayCategoryDish[] = []
  for (const payloadDish of dishes) {
    const dayCategoryDish = new DayCategoryDish();
    const dish = new Dish()
    dish.id = payloadDish.id
    dayCategoryDish.dayCategory = category
    dayCategoryDish.dish = dish
    dayCategoryDish.day = day
    dayCategoryDish.position = payloadDish.position
    categories.push(dayCategoryDish);
  }
  return categories
}

function createDayCategories(createPayload: DayCategoryPayload[], day: Day): DayCategory[] {
  const result = []
  for (const dayCategory of createPayload) {
    const category = new DayCategory();
    const { dishes } = dayCategory
    category.name = dayCategory.name;
    category.position = dayCategory.position
    category.dayCategoryDishes = createCategoryDishes({
      dishes,
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

  day.dayCategories = day.dayCategories.map(dayCategory => {
    const categoryToUpdate = mapping.categoiesToUpdateMapping[dayCategory.id]
    if (categoryToUpdate) {
      const position = categoryToUpdate.position
      return {
        ...dayCategory,
        position
      }
    }
    return dayCategory
  })


  if (isNotEmpty(mapping.categoriesToAdd)) {
    const newCategories = createDayCategories(mapping.categoriesToAdd, day)
    day.dayCategories = [...day.dayCategories, ...newCategories]
  }



  for (const dayCategory of day.dayCategories) {

    const { id } = dayCategory
    const updatePayload = mapping.categoiesToUpdateMapping[id]
    if (!updatePayload) continue
    const { dishes, name } = updatePayload
    dayCategory.name = name

    updateDayCategoriesDishes(dayCategory, dishes, day)
  }


  return day
}

function createIdToItemMapping<T>(items: (T & { id: number })[]): Record<number, T> {
  return items.reduce((acc, item) => {
    acc[item.id] = item
    return acc
  }, {})
}

function updateDayCategoriesDishes(dayCategory: DayCategory, dishes: DayCategoryDishesPayload[], day: Day) {

  const dishesPayloadMapping = createIdToItemMapping(dishes)

  const newDishes = dishes.map(({ id }) => id)
  const oldDishes = dayCategory.dayCategoryDishes.map(categoryDish => categoryDish.dish.id)

  const { productsCreated, productsRemoved } = getDishChanges(oldDishes, newDishes)



  if (isNotEmpty(productsRemoved)) {
    dayCategory.dayCategoryDishes = dayCategory.dayCategoryDishes.filter(categoryDish => !productsRemoved.includes(categoryDish.dish.id))
  }

  dayCategory.dayCategoryDishes = dayCategory.dayCategoryDishes.map(categoryDish => {
    const dishId = categoryDish.dish.id
    if (dishesPayloadMapping[dishId]) {
      const position = dishesPayloadMapping[dishId].position
      return {
        ...categoryDish,
        position
      }
    }
    return categoryDish
  })

  const dishesToCreate = dishes.filter(dish => productsCreated.includes(dish.id))


  if (isNotEmpty(productsCreated)) {
    const newDishes = createCategoryDishes({
      dishes: dishesToCreate,
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

// export function getDishChanges2(
//   oldState: number[],
//   newChanges: number[]
// ) {
//   const oldStateSet = new Set(oldState);
//   const newChangesSet = new Set(newChanges);

//   const productsRemoved = oldState.filter(item => !newChangesSet.has(item));
//   const productsCreated = newChanges.filter(item => !oldStateSet.has(item));

//   return {
//     productsRemoved,
//     productsCreated,
//   };
// }


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

  async createDay(dayName: string, dayContent: DayCategoryPayload[], userId: number) {
    const user = new User()
    user.id = userId

    let day = new Day();
    day.name = dayName;
    day.dayCategories = createDayCategories(dayContent, day);
    day.user = user
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
    updatedDayContent: DayCategoryPayload[],
    userId: number
  ) {
    const user = new User()
    user.id = userId
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
      .where('dayId IS NULL OR dayCategoryId IS NULL')
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
