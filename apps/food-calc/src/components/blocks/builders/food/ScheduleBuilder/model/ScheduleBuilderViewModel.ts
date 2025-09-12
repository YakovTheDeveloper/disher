import { UpdateChildrenStore } from "@/components/blocks/builders/food/shared/UpdateChildrenStore";
import { deepCopy } from "@/lib/copy/deepCopy";
import { CommonData } from "@/store/models/common/types";
import { ScheduleEntity, ScheduleItemEntity } from "@/store/scheduleStore/types";
import { throws } from "assert";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { v4 as uuidv4 } from 'uuid';

type DayScheduleUI = ScheduleEntity & {
  items: DayScheduleItemUI[];
};
export type DayScheduleItemUI = Omit<ScheduleItemEntity, "foodId" | "id"> & {
  id: string | number
};

export class ScheduleBuilderViewModel {
  constructor(raw: ScheduleEntity) {
    this.schedule = deepCopy(raw)
    this.children = new UpdateChildrenStore(() => this.schedule)
    makeAutoObservable(this);
  }

  schedule: DayScheduleUI;

  children: UpdateChildrenStore<ScheduleEntity, ScheduleItemEntity>

  get date() {
    return this.schedule.date
  }

  get id() {
    return this.schedule.id
  }

  get selectedItemId() {
    const current = this.children.current
    if (current?.dish) {
      return {
        variant: 'dish',
        id: current.dish.id
      }
    }
    if (current?.food) {
      return {
        variant: 'food',
        id: current.food.id
      }
    }
  }

  addChild = (data: Partial<{ food: CommonData, dish: CommonData }>) => {
    const item = createUIDayScheduleItem(data)
    const lastAddedScheduleItem = this.scheduleItems.at(-1)
    if (lastAddedScheduleItem) item.time = lastAddedScheduleItem.time
    this.schedule.items.push(item);
    return item.id
  }

  removeChild = (childId: string | number) => {
    const index = this.schedule.items.findIndex(item => item.id === childId);
    if (index >= 0) {
      this.schedule.items.splice(index, 1);
    }
  }

  removeChildrenByTimeAndId = (time: string, ids: number[]) => {
    this.schedule.items = this.schedule.items.filter(schedule => {
      const matchTime = schedule.time === time
      const matchId = ids.includes(schedule.food?.id ?? -1)
      return !(matchTime && matchId)
    })
  }

  private get scheduleItems() {
    return this.schedule.items;
  }

  get scheduleItemsSorted(): DayScheduleItemUI[] {
    return this.scheduleItems.toSorted((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      if (aHours !== bHours) return aHours - bHours;
      return aMinutes - bMinutes;
    });
  }

  get payload(): [any, any] {
    return [this.schedule, this.id]
  }

}

function createUIDaySchedule(): DayScheduleUI {
  return {
    date: "",
    id: -1,
    items: [],
  };
}

function createUIDayScheduleItem(data: Partial<{ food: CommonData, dish: CommonData }>): DayScheduleItemUI {
  const { dish = null, food = null } = data
  return {
    customFoodName: "",
    dish,
    id: uuidv4(),
    quantity: 100,
    time: '08:00',
    food
  };
}

function createMockScheduleItems(): DayScheduleItemUI[] {

  const item1 = createUIDayScheduleItem({})
  const item2 = createUIDayScheduleItem({})
  item2.time = '08:30'

  return [item1, item2]
}

export function createLocalSchedule(date?: string) {
  const schedule = createUIDaySchedule()
  if (date) schedule.date = date
  schedule.items = createMockScheduleItems()
  return schedule
}