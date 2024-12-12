import { IProductBase } from "@/types/dish/dish";
import { action, makeAutoObservable, toJS } from "mobx";
import { GenerateId } from "@/utils/uuidNumber";
import { EntityNames, ISODate, Operations } from "@/types/common/common";
import { notificationMessages } from "@/components/ui/Notification/NotificationMessages";
import { ModalStore } from "@/store/uiStore/modalStore/modalStore";


export type NotificationData = {
  id: number
  variant: 'success' | 'error'
  message: string
}

export type DayContent = 'day' | 'calendar'

export class UiStore {

  notification = new NotificationStore()

  modal = new ModalStore()

  dayCalendarDate: ISODate = ''

  setDayCalendarDate = (date: ISODate) => { this.dayCalendarDate = date }

  constructor() {
    makeAutoObservable(this);
  }
}

type NotificationPayload = Omit<NotificationData, 'id'>
type SpecificNotificationPayload = Omit<NotificationData, 'id' | 'variant'>


class NotificationStore {
  constructor() {
    makeAutoObservable(this);
  }
  currentNotification: NotificationData | null = null

  notifications: NotificationData[] = []

  setCurrentNotification = (data: NotificationData) => {
    // console.log(data)
    this.currentNotification = data
  }

  push = (data: NotificationPayload) => {
    const notification = { ...data, id: GenerateId() }
    this.notifications.push(notification)
    setTimeout(action(() => {
      this.removeNotification(notification.id)
    }), 3500)
  }

  success = (variant: EntityNames, operation: Operations, name: string) => {
    console.log("good", variant, operation)
    const message = notificationMessages[variant]['success'][operation]
    this.push({ variant: 'success', message: message(name) })
  }

  error = (variant: EntityNames, operation: Operations, name: string) => {
    const message = notificationMessages[variant]['error'][operation]
    this.push({ variant: 'error', message: message(name) })
  }

  removeNotification = (id: number) => {
    this.notifications = this.notifications.filter(notification => notification.id != id)
  }
}
