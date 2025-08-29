import { DaySchedule, DayScheduleItem } from "@/types/schedule";
import { makeAutoObservable, runInAction } from "mobx";

type DayScheduleUI = DaySchedule & {
  isLocal?: boolean;
  items: DayScheduleItemUI[];
};
export type DayScheduleItemUI = Omit<DayScheduleItem, "foodId"> & {
  foodId: null | number;
};
export enum Suggestion {
  Time = "time",
  Food = "food",
  Quantity = "quantity"
}

export class ScheduleBuilderViewModel {
  constructor(raw?: DaySchedule) {
    if (raw) {
      this.schedule = raw;
      return;
    }
    this.schedule = createUIDaySchedule();
    this.schedule.items = createMockScheduleItems()
    makeAutoObservable(this);
  }

  schedule: DayScheduleUI;

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
  }: Partial<DayScheduleItem>) => {
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

  get scheduleItemsSorted(): DayScheduleItem[] {
    return this.scheduleItems.toSorted((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      if (aHours !== bHours) return aHours - bHours;
      return aMinutes - bMinutes;
    });
  }

}

function createUIDaySchedule(): DayScheduleUI {
  return {
    date: "",
    id: -1,
    items: [],
    isLocal: true,
  };
}

function createUIDayScheduleItem(): DayScheduleItemUI {
  return {
    foodId: null,
    foodName: "",
    id: Math.random(),
    quantity: 100,
    time: '08:00',
  };
}

function createMockScheduleItems() {

  const item1 = createUIDayScheduleItem()
  const item2 = createUIDayScheduleItem()
  item2.time = '08:30'

  return [item1, item2]
}