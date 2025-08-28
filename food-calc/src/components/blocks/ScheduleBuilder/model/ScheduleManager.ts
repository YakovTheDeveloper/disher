import { makeAutoObservable } from "mobx";

type DaySchedule = {
  id: number;
  date: string;
  items: {
    id: number;
    foodId: number;
    foodName: string;
    quantity: number;
    time: string;
  }[];
};

class ScheduleManager {
  constructor() {
    makeAutoObservable(this);
  }


  
}
