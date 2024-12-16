import { makeAutoObservable } from "mobx";
import { ISODate } from "@/types/common/common";
import { ModalStore } from "@/store/uiStore/modalStore/modalStore";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";


export type NotificationData = {
  id: number
  variant: 'success' | 'error'
  message: string
}

export type DayContent = 'day' | 'calendar'

export class UiStore {

  modal = new ModalStore()

  dayCalendarDate: ISODate = ''

  tooltip = new TooltipStore()

  setDayCalendarDate = (date: ISODate) => { this.dayCalendarDate = date }

  constructor(private notification: NotificationStore) {
    makeAutoObservable(this);
  }
}


class TooltipStore {
  constructor() {
    makeAutoObservable(this);
  }

  removableTooltipOpen = false
  open = () => this.removableTooltipOpen = true
  close = () => this.removableTooltipOpen = false
}