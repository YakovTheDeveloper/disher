import { DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { FoodQuantityDTO } from "@/components/blocks/builders/food/shared/dto";
import { CollectionItemEntity, UpdateChildrenStore } from "@/components/blocks/builders/food/shared/UpdateChildrenStore";
import { deepCopy } from "@/lib/copy/deepCopy";
import { DishEntity, DishItemEntity } from "@/store/models/dish/types";
import { ScheduleEntity, ScheduleItemEntity } from "@/store/models/schedule/types";
import { throws } from "assert";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { v4 as uuidv4 } from 'uuid';

export type DishUI = Omit<DishEntity, 'items'> & {
  items: DishItemUI[];
};
export type DishItemUI = Omit<DishItemEntity, | "id"> & {
  id: string | number
  status: CollectionItemEntity['status']
};

function foodCollectionToUIAdapter(dto: FoodQuantityDTO[]): DishUI {
  return createDishLocal(dto);
}

function toUIAdapter(raw: DishEntity): DishUI {
  const copy = deepCopy(raw);
  return {
    ...copy,
    items: copy.items.map((item) => ({
      ...item,
      status: null,
    })),
  };
}

export class DishBuilderViewModel {
  constructor(raw: DishEntity | FoodQuantityDTO[]) {
    if ('name' in raw) {
      this.content = toUIAdapter(raw)
    } else {
      this.content = foodCollectionToUIAdapter(raw)
    }
    this.children = new UpdateChildrenStore(() => this.content)
    makeAutoObservable(this);
  }

  content: DishUI;

  children: UpdateChildrenStore<DishUI, DishItemUI>

  get name() {
    return this.content.name
  }

  get id() {
    return this.content.id
  }

  addChild = (food: { id: number, name: string }) => {
    const item = createDishItemLocal(food)
    this.content.items.push(item);
    return item.id
  }

  removeChild = (childId: string | number) => {
    const index = this.content.items.findIndex(item => item.id === childId);
    if (index >= 0) {
      this.content.items.splice(index, 1);
    }
  }

  updateName = (name: string) => {
    this.content.name = name
  }

  private get items() {
    return this.content.items;
  }

  payload = () => {
    return this.content
  }

  get itemsLength() {
    return this.content.items.length
  }

  get selectedItemId() {
    const current = this.children.current
    if (!current) return
    return {
      variant: 'food',
      id: current.food.id
    }

  }
}

function createDishItemLocal(food: { id: number, name: string }): DishItemUI {
  return {
    food,
    id: uuidv4(),
    quantity: 100,
    status: 'added'
  };
}

// function createMockScheduleItems(): DishItemUI[] {

//   const item1 = createUIDayScheduleItem()
//   const item2 = createUIDayScheduleItem()
//   item2.time = '08:30'

//   return [item1, item2]
// }

export function createDishLocal(itemsDto: FoodQuantityDTO[] = []): DishUI {
  const items: DishItemUI[] = itemsDto.map(({ food, quantity }) => ({ food, quantity, id: uuidv4(), status: 'added' }))
  return {
    id: -1,
    name: 'Новое блюдо',
    items
  };
}