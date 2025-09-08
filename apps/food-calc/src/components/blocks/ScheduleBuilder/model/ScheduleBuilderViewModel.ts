import { ScheduleEntity, ScheduleItemEntity } from "@/store/scheduleStore/types";
import { throws } from "assert";
import { makeAutoObservable, runInAction, toJS } from "mobx";
import { v4 as uuidv4 } from 'uuid';

type DayScheduleUI = ScheduleEntity & {
  items: DayScheduleItemUI[];
};
export type DayScheduleItemUI = Omit<ScheduleItemEntity, "foodId" | "scheduleId"> & {
  foodId: null | number | undefined;
  scheduleId: null | number | undefined;
  key: string
};
export enum Suggestion {
  Time = "time",
  Food = "food",
  Quantity = "quantity"
}

export class ScheduleBuilderViewModel {
  constructor(raw: ScheduleEntity | null, onSave: (payload: ScheduleEntity, id?: number) => Promise<ScheduleEntity>) {
    this.schedule = JSON.parse(JSON.stringify(raw));
    this.onSave = onSave
    makeAutoObservable(this);
    return;
  }

  schedule: DayScheduleUI;

  onSave: (payload: ScheduleEntity, id?: number) => Promise<ScheduleEntity>

  get date() {
    return this.schedule.date
  }

  get id() {
    return this.schedule.id
  }

  get currentScheduleItem() {
    return this.schedule.items.find(({ id }) => this.currentScheduleId === id) || null
  }

  currentScheduleId = -1
  currentSuggestion: Suggestion | null = null

  setCurrentScheduleItemId = (id: number) => {
    this.currentScheduleId = id
  }

  setCurrentSuggestion = (value: Suggestion | null) => {
    this.currentSuggestion = value
  }

  updateCurrentScheduleItem = ({
    quantity,
    foodName,
    time,
    foodId
  }: Partial<ScheduleItemEntity>) => {
    if (!this.currentScheduleItem) return;
    if (quantity != null) this.currentScheduleItem.quantity = quantity;
    if (foodName != null) this.currentScheduleItem.foodName = foodName;
    if (time != null) this.currentScheduleItem.time = time;
    if (foodId != null) this.currentScheduleItem.foodId = foodId;
  };

  onSuggestionSelect = (foodId: number, foodName: string) => {
    this.updateCurrentScheduleItem({ foodId, foodName });
    this.setCurrentScheduleItemId(-1)
  }

  acceptTime = (time: string) => {
    this.updateCurrentScheduleItem({ time });
    this.setCurrentScheduleItemId(-1)
    this.setCurrentSuggestion(null)
  }

  acceptQuantity = (quantity: number) => {
    this.updateCurrentScheduleItem({ quantity });
    this.setCurrentScheduleItemId(-1)
    this.setCurrentSuggestion(null)
  }

  onScheduleItemAddHandler = () => {
    const item = createUIDayScheduleItem()
    const lastAddedScheduleItem = this.scheduleItems.at(-1)
    if (lastAddedScheduleItem) item.time = lastAddedScheduleItem.time
    this.addScheduleItem(item)
    this.setCurrentScheduleItemId(item.id)
    this.setCurrentSuggestion(Suggestion.Food)
  }

  private addScheduleItem = (item: DayScheduleItemUI) => {
    this.schedule.items.push(item);
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

  onFinish = async () => {
    console.log('finish', toJS(this.schedule));
    await this.onSave(this.schedule, this.id)
  }

}

function createUIDaySchedule(): DayScheduleUI {
  return {
    date: "",
    id: -1,
    items: [],
  };
}

function createUIDayScheduleItem(): DayScheduleItemUI {
  return {
    foodId: null,
    foodName: "",
    dishId: null,
    id: uuidv4(),
    quantity: 100,
    time: '08:00',
  };
}

function createMockScheduleItems(): DayScheduleItemUI[] {

  const item1 = createUIDayScheduleItem()
  const item2 = createUIDayScheduleItem()
  item2.time = '08:30'

  return [item1, item2]
}

export function createLocalSchedule(date?: string) {
  const schedule = createUIDaySchedule()
  if (date) schedule.date = date
  schedule.items = createMockScheduleItems()
  return schedule
}