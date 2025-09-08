import { notificationMessages } from "@/components/ui/Notification/NotificationMessages";
import { NotificationData } from "@/store/uiStore/uiStore";
import { EntityNames, Operations } from "@/types/common/common";
import { GenerateId } from "@/utils/uuidNumber";
import { makeAutoObservable, action } from "mobx";

type NotificationPayload = Omit<NotificationData, 'id'>

export class NotificationStore {
    constructor() {
        makeAutoObservable(this);
    }

    notifications: NotificationData[] = []

    private push = (data: NotificationPayload) => {
        const notification = { ...data, id: GenerateId() }
        this.notifications.push(notification)
        setTimeout(action(() => {
            this.removeNotification(notification.id)
        }), 3500)
    }

    success = (variant: EntityNames, operation: Operations, name: string) => {
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
