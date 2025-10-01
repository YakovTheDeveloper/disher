import { makeAutoObservable } from "mobx";
import { ISODate } from "@/types/common/common";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { DailyNormsStoreUI } from "@/store/uiStore/dailyNorms/DailyNormsStoreUI";
import { dailyNormModelStore } from "@/store/rootStore";
import { MenuUiStore } from "@/store/uiStore/menu/menuUiStore";

export type NotificationData = {
  id: number
  variant: 'success' | 'error'
  message: string
}

export type DayContent = 'day' | 'calendar'

export class UiStore {

  dayCalendarDate: ISODate = new Date().toISOString()

  // tooltip = new TooltipStore()

  setDayCalendarDate = (date: ISODate) => { this.dayCalendarDate = date }

  notification: NotificationStore

  dailyNorms = new DailyNormsStoreUI(dailyNormModelStore)

  menu = new MenuUiStore()

  // day = {
  //   showDishChoice: false
  // }

  constructor(
    notification: NotificationStore,
  ) {
    this.notification = notification
    makeAutoObservable(this);
  }
}
