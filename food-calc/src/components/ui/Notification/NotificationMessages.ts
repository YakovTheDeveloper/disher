import { EntityNames, Operations } from "@/types/common/common"



export const notificationMessages: Messages = {
    day: {
        success: {
            save: (day: string) => `Вы добавили ${day}!`,
            update: (day: string) => `Вы обновили ${day}!`,
            delete: (day: string) => `Вы удалили ${day}`,
        },
        error: {
            save: () => `Не получилось сохранить, попробуйте позднее`,
            update: () => `Не получилось обновить, попробуйте позднее`,
            delete: () => `Не получилось удалить, попробуйте позднее`,
            getAll: () => `Не удалось получить дни, попробуйте позднее`
        }
    },
    dish: {
        success: {
            save: (day: string) => `Вы добавили ${day}!`,
            update: (day: string) => `Вы обновили ${day}!`,
            delete: (day: string) => `Вы удалили ${day}`,
        },
        error: {
            save: () => `Не получилось сохранить, попробуйте позднее`,
            update: () => `Не получилось обновить, попробуйте позднее`,
            delete: () => `Не получилось удалить, попробуйте позднее`,
            getAll: () => `Не удалось получить блюда, попробуйте позднее`
        }
    },
    norm: {
        success: {
            save: (day: string) => `Вы добавили ${day}!`,
            update: (day: string) => `Вы обновили ${day}!`,
            delete: (day: string) => `Вы удалили ${day}`,
        },
        error: {
            save: () => `Не получилось сохранить, попробуйте позднее`,
            update: () => `Не получилось обновить, попробуйте позднее`,
            delete: () => `Не получилось удалить, попробуйте позднее`,
            getAll: () => `Не удалось получить нормы, попробуйте позднее`
        }
    }

}

type OperationObject = Record<Operations, (name: string) => string>

type Messages = Record<EntityNames, {
    success: Omit<OperationObject, 'getAll'>
    error: OperationObject
}>