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
  coefficient: number
}

type DayCategoryPayload = {
  id?: number, name: string; dishes: DayCategoryDishesPayload[], position: number
}

function createCategoryDishes(data: {
  dishes: DayCategoryDishesPayload[],
  category: DayCategory
}) {
  const { category, dishes } = data
  const categories: DayCategoryDish[] = []
  for (const payloadDish of dishes) {
    const dayCategoryDish = new DayCategoryDish();
    const dish = new Dish()
    dish.id = payloadDish.id
    dayCategoryDish.dayCategory = category
    dayCategoryDish.dish = dish
    dayCategoryDish.position = payloadDish.position
    dayCategoryDish.coefficient = payloadDish.coefficient
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

    @Inject(DAY_CATEGORY_REPOSITORY)
    private dayCategoryRepository: Repository<DayCategory>,


    @Inject(DAY_CATEGORY_DISH_REPOSITORY)
    private dayCategoryDishRepository: Repository<DayCategory>,
  ) { }

  // async createDay2(dto: CreateDayDto, userId: number) {
  //   const day = this.dayRepository.create(dto)
  //   const user = new User()
  //   user.id = userId
  //   day.user = user

  //   const dayCategories = this.dayCategoryRepository.create(dto.categories)
  //   const dayCategoriseDishes = this.dayCategoryDishRepository.create(dto.categories)
  // }

  async createDay(dto: CreateDayDto, userId: number) {
    const user = new User()
    user.id = userId


    const { categories, name, date = '' } = dto
    let day = new Day();
    day.name = name;
    if (date) day.date = date
    day.dayCategories = createDayCategories(categories, day);
    day.user = user
    const newDay = await this.dayRepository.save(day)
    const dayWithRelations = await this.dayRepository.findOne({
      where: { id: newDay.id },
      relations: [
        'dayCategories.dayCategoryDishes',
        'dayCategories.dayCategoryDishes.dish',
      ],
    });



    const result = {

      id: dayWithRelations.id,
      name: dayWithRelations.name,
      categories: dayWithRelations.dayCategories.map(category => ({
        id: category.id,
        name: category.name,
        position: category.position,
        dishes: category.dayCategoryDishes.map(dishRelation => ({
          id: dishRelation.dish.id,
          name: dishRelation.dish.name,
        })),
      })),

    };

    return {
      result
    };

    console.log(newDay.dayCategories.map(dc => dc.dayCategoryDishes.map(d => d.dish)))

    return dayWithRelations

    return {
      result: {
        name: newDay.name,
        id: newDay.id,
        categories: newDay.dayCategories.map(({ id, name, position, dayCategoryDishes }) => ({
          id,
          name,
          position,
          dishes: dayCategoryDishes.map(dishCategory => {
            console.log(dishCategory)
            return {
              id: dishCategory.dish.id,
              name: dishCategory.dish.name
            }
          })
        }))
      }
    }
  }

  async findAll(userId: number): Promise<Day[]> {
    const user = new User()
    user.id = +userId
    const days = await this.dayRepository.find({
      relations: ['dayCategories'],
      where: { user }
    });

    const transformedData = days.map(day => ({
      id: day.id,
      name: day.name,
      date: day.date,
      categories: day.dayCategories.map(category => ({
        id: category.id,
        name: category.name,
        position: category.position,
        dishes: category.dayCategoryDishes.map(dishInfo => ({
          coefficient: dishInfo.coefficient,
          id: dishInfo.dish.id,
          name: dishInfo.dish.name,
          products: dishInfo.dish.dishToProducts.map(dishToProducts => ({
            quantity: dishToProducts.quantity,
            id: dishToProducts.product.id
          }))
        })),
      })),
    }));
    return {
      result: transformedData
    }

    return {
      result: days.map(day => {

        const dishes = day.dayCategoryDishes.map(dishCategory => ({
          id: dishCategory.dish.id,
          position: dishCategory.position,
          name: dishCategory.dish.name
        }))

        console.log(day.dayCategoryDishes)
        // Group dishes within their respective categories
        const categoriesWithDishes = day.dayCategories.map(category => ({
          id: category.id,
          name: category.name,
          position: category.position,
          dishes: dishes || [], // Assuming `categoryId` in DayCategoryDish links to DayCategory
        }));

        return {
          id: day.id,
          name: day.name,
          // dayCategories: day.dayCategories,
          categories: categoriesWithDishes, // Replace dayCategories with updated structure
          dayCategoryDishes: undefined, // Remove the top-level dayCategoryDishes property
        }
      })
    }
  }

  async update(
    dayId: number,
    dto: UpdateDayDto,
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


    if (dto.name) existingDay.name
    if (dto.date) existingDay.date = dto.date


    updateDayCategories(dto.categories, existingDay)

    await this.dayRepository.save(existingDay);
    await this.dayCategoryRepository
      .createQueryBuilder()
      .delete()
      .where('dayId IS NULL')
      .execute();

    return {
      result: true
    }






  }


  async remove(id: number, userId: number) {
    const result = await this.dayRepository.delete({ id, user: { id: userId } })
    return {
      result: true
    }
  }

}
