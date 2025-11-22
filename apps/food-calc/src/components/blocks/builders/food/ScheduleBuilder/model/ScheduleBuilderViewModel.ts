import { DayEventsBuilderViewModel, ScheduleQuestionnaireItemUI } from "@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel";
import { UpdateChildrenStore } from "@/components/blocks/builders/food/shared/UpdateChildrenStore";
import { DaySchedule } from "@/domain/schedule";
import { deepCopy } from "@/lib/copy/deepCopy";
import { CommonData } from "@/store/models/common/types";
import { DishEntity } from "@/store/models/dish/types";
import { FoodEntity } from "@/store/models/food/types";
import { getTotalFoodAndDishFoodQuantityFromSchedule } from "@/store/models/schedule/schedule.domain";
import { DailyEventEntity, ScheduleEntity, ScheduleItemEntity } from "@/store/models/schedule/types";
import { makeAutoObservable, runInAction } from "mobx";
import { Instance } from "mobx-state-tree";
import { v4 as uuidv4 } from 'uuid';

export type DayScheduleItemUIStatus = 'added' | 'deleted' | 'modified' | null

export type DayScheduleUI = Omit<ScheduleEntity, 'items' | 'dailyEvents'> & {
  items: DayScheduleItemUI[];
  dailyEvents: ScheduleQuestionnaireItemUI[] | null
};
export type DayScheduleItemUI = Omit<ScheduleItemEntity, "id"> & {
  id: string | number
  status: DayScheduleItemUIStatus
};

export type DayScheduleItemCopyPayloadUI = Omit<DayScheduleItemUI, 'status'>

export type AddChild = { food: null, dish: DishEntity, time?: string, quantity?: number, customFoodName?: string } | { food: CommonData, dish: null, time?: string, quantity?: number, customFoodName?: string } | {
  dish: null,
  food: null,
  customFoodName: string
}

export type TimeGroupUI<T = DayScheduleItemUI> = { time: string; items: T[], offset: { hours: number; minutes: number } | null; }

function scheduleToUIAdapter(raw: ScheduleEntity): DayScheduleUI {
  const copy = deepCopy(raw);
  const dailyEvents = raw.dailyEvents ? JSON.parse(raw.dailyEvents) as DailyEventEntity[] : null
  const dailyEventsAdapted: ScheduleQuestionnaireItemUI[] = dailyEvents?.map(event => ({
    status: null,
    data: event.content,
    time: event.time,
    id: uuidv4()
  })) ?? []
  return {
    ...copy,
    dailyEvents: dailyEventsAdapted,
    items: copy.items.map((item) => ({
      ...item,
      status: null,
    })),
  };
}

function scheduleToUIAdapterV2(raw: ScheduleEntity): Instance<typeof DaySchedule> {
  const copy = deepCopy(raw);
  const dailyEvents = raw.dailyEvents ? JSON.parse(raw.dailyEvents) as DailyEventEntity[] : null
  const dailyEventsAdapted: ScheduleQuestionnaireItemUI[] = dailyEvents?.map(event => ({
    status: null,
    data: event.content,
    time: event.time,
    id: uuidv4()
  })) ?? []
  return {
    ...copy,

    dailyEvents: dailyEventsAdapted,

    items: copy.items.map(i => ({
      ...i,
      status: "none" // MST-friendly version of null
    }))
  };
}

export class ScheduleBuilderViewModel {
  constructor(raw: ScheduleEntity) {
    const adapted = scheduleToUIAdapter(raw)
    this.schedule = adapted

    console.log('adapted', adapted);

    this.children = new UpdateChildrenStore(() => this.schedule)
    this.dailyEvents = new DayEventsBuilderViewModel(adapted.dailyEvents)
    makeAutoObservable(this)
  }

  schedule: DayScheduleUI;

  dailyEvents: DayEventsBuilderViewModel

  children: UpdateChildrenStore<DayScheduleUI, DayScheduleItemUI>

  get currentDailyEventData() {
    return this.dailyEvents.children.current?.data || null
  }

  get currentChild(): DayScheduleItemUI | null {
    return this.children.current || null
  }

  get dailyEventItemsStore() {
    return this.dailyEvents.children
  }

  get customItems() {
    return this.schedule.items.filter(({ customFoodName, dish, food }) => {
      return customFoodName !== '' && dish == null && food == null
    })
  }

  get foodWithQuantity() {
    const current = this.children.current
    if (!current) return []
    return getTotalFoodAndDishFoodQuantityFromSchedule(current)
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

  get isNoItems() {
    return this.schedule.items.length === 0
  }

  get isNoDailyEventItems() {
    return this.dailyEvents.content.items.length === 0

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

  addChild = (data: AddChild, timeAsLastChildAdded: boolean = true) => {
    const item = createUIDayScheduleItem(data)
    if (timeAsLastChildAdded) {
      const lastAddedScheduleItem = this.scheduleItems.at(-1)
      if (lastAddedScheduleItem) item.time = lastAddedScheduleItem.time
    }
    this.schedule.items.push(item);
    return item.id
  }

  addChildren = (items: AddChild[]) => {
    runInAction(() => {
      items.forEach(item => {
        this.schedule.items.push(createUIDayScheduleItem(item));
      })
    })
  }

  getChildContentVariant = (payload: DishEntity | FoodEntity | string) => {
    const isCustom = typeof payload === 'string';
    if (isCustom) return {
      dish: null,
      food: null,
      customFoodName: payload,
    }
    const isDish = 'items' in payload;
    if (isDish) return {
      dish: {
        id: payload.id,
        items: payload.items,
        name: payload.name,
      },
      customFoodName: '',
      food: null,
    }
    return {
      food: {
        id: payload.id,
        name: payload.name,
      },
      customFoodName: '',
      dish: null,
    }
  }

  removeChildrenByFoodIdsAndTime = (foodIds: number[], time: string) => {
    runInAction(() => {
      this.schedule.items.forEach(item => {
        if (item.food && foodIds.includes(item.food.id) && item.time === time) {
          this.children.deleteChild(item.id)
        }
      })
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

  payload = (): DayScheduleUI => {
    return {
      ...this.schedule,
      dailyEvents: this.dailyEvents.payload()
    }
  }

}

function createUIDaySchedule(): DayScheduleUI {
  return {
    date: "",
    id: -1,
    items: [],
    dailyEvents: []
  };
}

// function createUIDayScheduleItem(data: Partial<{ food: CommonData, dish: CommonData }>): DayScheduleItemUI {
function createUIDayScheduleItem(data: Partial<DayScheduleItemUI>): DayScheduleItemUI {
  const { dish = null, food = null, time = '08:00', quantity = 100, customFoodName = '' } = data
  return {
    customFoodName,
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