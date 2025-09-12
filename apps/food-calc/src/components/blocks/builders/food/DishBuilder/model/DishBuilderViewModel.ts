import { FoodQuantityDTO } from "@/components/blocks/builders/food/shared/dto";
import { UpdateChildrenStore } from "@/components/blocks/builders/food/shared/UpdateChildrenStore";
import { deepCopy } from "@/lib/copy/deepCopy";
import { DishEntity, DishItemEntity } from "@/store/models/dish/types";
import { ScheduleEntity, ScheduleItemEntity } from "@/store/scheduleStore/types";
import { throws } from "assert";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { v4 as uuidv4 } from 'uuid';

export type DishUI = DishEntity & {
  items: DishItemUI[];
};
export type DishItemUI = Omit<DishItemEntity, | "id"> & {
  id: string | number
};

export class DishBuilderViewModel {
  constructor(raw: DishEntity) {
    this.schedule = deepCopy(raw)
    this.children = new UpdateChildrenStore(() => this.schedule)
    makeAutoObservable(this);
  }

  schedule: DishUI;

  children: UpdateChildrenStore<DishEntity, DishItemEntity>

  get name() {
    return this.schedule.name
  }

  get id() {
    return this.schedule.id
  }

  addChild = (food: { id: number, name: string }) => {
    const item = createDishItemLocal(food)
    this.schedule.items.push(item);
    return item.id
  }

  removeChild = (childId: string | number) => {
    const index = this.schedule.items.findIndex(item => item.id === childId);
    if (index >= 0) {
      this.schedule.items.splice(index, 1);
    }
  }

  updateName = (name: string) => {
    this.schedule.name = name
  }

  private get scheduleItems() {
    return this.schedule.items;
  }

  get payload(): [any, any] {
    return [this.schedule, this.id]
  }
}

function createDishItemLocal(food: { id: number, name: string }): DishItemUI {
  return {
    food,
    id: uuidv4(),
    quantity: 100,
  };
}

// function createMockScheduleItems(): DishItemUI[] {

//   const item1 = createUIDayScheduleItem()
//   const item2 = createUIDayScheduleItem()
//   item2.time = '08:30'

//   return [item1, item2]
// }

export function createDishLocal(items: FoodQuantityDTO[] = []): DishUI {
  return {
    id: -1,
    name: 'Новое блюдо',
    items: items.map(({ food, quantity }) => ({ food, quantity, id: uuidv4() }))
  };
}