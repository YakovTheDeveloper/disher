import { IProductBase } from "@/types/dish/dish";
import { action, makeAutoObservable, toJS } from "mobx";
import { GenerateId } from "@/utils/uuidNumber";
import { EntityNames, Operations } from "@/types/common/common";
import { notificationMessages } from "@/components/ui/Notification/NotificationMessages";

export enum Modals {
  Auth = "Auth",
  Product = "Product",
}

type Payload = { Product: IProductBase | null };

export type NotificationData = {
  id: number
  variant: 'success' | 'error'
  message: string
}

export class UiStore {
  currentModal: Modals | null = null;

  data: {
    Auth: null;
    Product: IProductBase | null;
  } = {
      Auth: null,
      Product: null,
    };

  notification = new NotificationStore()

  openModal = (id: Modals, data?: Payload) => {
    console.log(toJS(data?.Product));
    this.currentModal = id;
    if (!data) return;
    data.Product = structuredClone(toJS(data.Product));
    this.setData(data);
  };

  closeModal = () => {
    this.currentModal = null;
  };





  setData = (data: Payload) => {
    this.data = { ...this.data, ...data };
  };

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
