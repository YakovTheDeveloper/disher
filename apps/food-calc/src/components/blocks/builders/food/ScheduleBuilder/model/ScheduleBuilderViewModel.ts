import { createQuestionnaire, QuestionnaireViewModel } from "@/components/blocks/builders/food/ScheduleBuilder/model/QuestionnaireViewModel";
import { UpdateChildrenStore } from "@/components/blocks/builders/food/shared/UpdateChildrenStore";
import { deepCopy } from "@/lib/copy/deepCopy";
import { CommonData } from "@/store/models/common/types";
import { DishEntity } from "@/store/models/dish/types";
import { getTotalFoodAndDishFoodQuantityFromAll, getTotalFoodAndDishFoodQuantityFromOne } from "@/store/scheduleStore/schedule.domain";
import { ScheduleEntity, ScheduleItemEntity, ScheduleQuestionnaire } from "@/store/scheduleStore/types";
import { makeAutoObservable, makeObservable, observable, runInAction, toJS } from "mobx";
import { v4 as uuidv4 } from 'uuid';

export type DayScheduleItemUIStatus = 'added' | 'deleted' | 'modified' | null

export type DayScheduleUI = Omit<ScheduleEntity, 'items' | 'questionnaire'> & {
  items: DayScheduleItemUI[];
  questionnaire: ScheduleQuestionnaire | null
};
export type DayScheduleItemUI = Omit<ScheduleItemEntity, "foodId" | "id"> & {
  id: string | number
  status: DayScheduleItemUIStatus
};

type AddChild = { food: null, dish: DishEntity } | { food: CommonData, dish: null }

export type TimeGroupUI = { time: string; items: DayScheduleItemUI[], offset: { hours: number; minutes: number } | null; }

function scheduleToUIAdapter(raw: ScheduleEntity): DayScheduleUI {
  const copy = deepCopy(raw);
  const questionnaire = raw.questionnaire
  return {
    ...copy,
    questionnaire: questionnaire ? JSON.parse(questionnaire) : null,
    items: copy.items.map((item) => ({
      ...item,
      status: null,
    })),
  };
}

export class ScheduleBuilderViewModel {
  constructor(raw: ScheduleEntity) {
    this.schedule = scheduleToUIAdapter(raw)
    this.children = new UpdateChildrenStore(() => this.schedule)
    this.questionnaire = new QuestionnaireViewModel(() => this.schedule)
    makeAutoObservable(this)
  }

  schedule: DayScheduleUI;

  children: UpdateChildrenStore<DayScheduleUI, DayScheduleItemUI>

  questionnaire: QuestionnaireViewModel

  get foodWithQuantity() {
    const current = this.children.current
    if (!current) return []
    return getTotalFoodAndDishFoodQuantityFromOne(current)
  }

  // get totalScheduleFoodWithQuantity() {
  //   return getTotalFoodAndDishFoodQuantityFromAll(this.schedule.items)
  // }

  get date() {
    return this.schedule.date
  }

  get id() {
    return this.schedule.id
  }

  get itemsLength() {
    return this.schedule.items.length
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

  getAllFoodAndDishFoodQuantity = () => {

  }

  addChild = (data: AddChild) => {
    const item = createUIDayScheduleItem(data)
    const lastAddedScheduleItem = this.scheduleItems.at(-1)
    if (lastAddedScheduleItem) item.time = lastAddedScheduleItem.time
    this.schedule.items.push(item);
    return item.id
  }

  deleteChild = (childId: string | number) => {
    const item = this.schedule.items.find(item => item.id === childId);
    if (!item) return

    if (item.status === 'added') {
      this.schedule.items = this.schedule.items.filter(i => i.id !== childId);
      return
    }
    item.status = 'deleted';
  };

  recoverDeletedChild = (childId: string | number) => {
    const item = this.schedule.items.find(item => item.id === childId);
    if (!item) return

    if (item.status === 'deleted') {
      item.status = null;
    }
  };

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

  get itemsGroupedByTime(): TimeGroupUI[] {
    const sorted = this.schedule.items.slice().sort((a, b) =>
      a.time.localeCompare(b.time) // works for HH:mm format
    );

    const toMinutes = (t: string) => {
      const [hours, minutes] = t.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const groups: {
      time: string;
      items: DayScheduleItemUI[];
      offset: { hours: number; minutes: number } | null;
    }[] = [];

    let prevTimeMinutes: number | null = null;

    for (const item of sorted) {
      const currentMinutes = toMinutes(item.time);
      let group = groups[groups.length - 1];

      if (!group || group.time !== item.time) {
        const diff = prevTimeMinutes == null ? null : currentMinutes - prevTimeMinutes;

        group = {
          time: item.time,
          items: [],
          offset: diff === null
            ? null
            : {
              hours: Math.floor(diff / 60),
              minutes: diff % 60,
            },
        };

        groups.push(group);
        prevTimeMinutes = currentMinutes;
      }

      group.items.push(item);
    }

    return groups;
  }

  payload = () => {
    return this.schedule
  }

}

function createUIDaySchedule(): DayScheduleUI {
  return {
    date: "",
    id: -1,
    items: [],
    questionnaire: null
  };
}

// function createUIDayScheduleItem(data: Partial<{ food: CommonData, dish: CommonData }>): DayScheduleItemUI {
function createUIDayScheduleItem(data: Partial<DayScheduleItemUI>): DayScheduleItemUI {
  const { dish = null, food = null, time = '08:00', quantity = 100 } = data
  return {
    customFoodName: "название кастомное",
    status: 'added',
    dish,
    food,
    id: uuidv4(),
    quantity,
    time
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

export function makeScheduleItemsSignature(items: DayScheduleUI['items']): string {
  return items
    .map((i) => {
      const dishPart = i.dish
        ? `${i.dish.id}:${i.dish.items
          .map((d) => `${d.food.id}:${d.quantity}`)
          .join("|")}`
        : "";

      return [
        `id:${i.id}`,
        `food:${i.food ? i.food.id : "null"}`,
        `qty:${i.quantity}`,
        `dish:${dishPart}`,
      ].join(";");
    })
    .join("||");
}