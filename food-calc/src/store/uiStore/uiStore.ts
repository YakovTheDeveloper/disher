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

  dayCalendarDate: ISODate = new Date().toISOString()

  tooltip = new TooltipStore()

  setDayCalendarDate = (date: ISODate) => { this.dayCalendarDate = date }

  notification: NotificationStore
  modal: ModalStore

  constructor(
    notification: NotificationStore,
    modal: ModalStore
  ) {
    this.notification = notification
    this.modal = modal
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