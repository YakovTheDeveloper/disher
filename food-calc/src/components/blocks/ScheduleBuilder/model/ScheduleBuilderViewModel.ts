import { makeAutoObservable } from "mobx";

type DaySchedule = {
  id: number;
  date: string;
  items: DayScheduleItem[];
};

type DayScheduleItem = {
  id: number;
  foodId: number;
  foodName: string;
  quantity: number;
  time: string;
};

type DayScheduleUI = DaySchedule & {
  isLocal?: boolean;
  items: DayScheduleItemUI[];
};
export type DayScheduleItemUI = Omit<DayScheduleItem, "foodId"> & {
  foodId: null | number;
};

export class ScheduleBuilderViewModel {
  constructor(raw?: DaySchedule) {
    makeAutoObservable(this);
    if (raw) {
      this.schedule = raw;
      return;
    }
    this.schedule = createUIDaySchedule();
  }

  schedule: DayScheduleUI;

  currentScheduleItem: DayScheduleItemUI | null = null;

  setCurrentScheduleItem = (schedule: DayScheduleItem) => {
    this.currentScheduleItem = schedule;
  };

  updateCurrentScheduleItem = ({
    quantity,
    foodName,
  }: {
    quantity: number;
    foodName: string;
  }) => {
    if (!this.currentScheduleItem) return;
    if (quantity) this.currentScheduleItem.quantity = quantity;
    if (foodName) this.currentScheduleItem.foodName = foodName;
  };

  get scheduleItems() {
    return this.schedule.items;
  }

  createItem = () => {
    this.schedule.items.push(createUIDayScheduleItem());
  };
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
    time: "",
  };
}
