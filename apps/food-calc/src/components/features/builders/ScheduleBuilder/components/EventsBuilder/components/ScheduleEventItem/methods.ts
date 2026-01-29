import { EventItem } from "@/domain/schedule/scheduleEvent/scheduleEvent";
import { Instance } from "mobx-state-tree";

export function getEventDescription(item: Instance<typeof EventItem>): string {
    const variant = item.type;

    switch (variant) {
        case 'sleep':
            return `Сон: ${item.value}, качество ${item.value}/10`;
        case 'mood':
            return `Настроение: ${item.value}/10`;
        case 'energy':
            return `Энергия: ${item.value}/10`;
        case 'digestion':
            return `Пищеварение (${item.type}): ${item.value}/10`;
        case 'activity':
            return `Активность: ${item.type}, ${item.value}`;
        case 'note':
            return `Заметка: ${item.value}`;
    }
}