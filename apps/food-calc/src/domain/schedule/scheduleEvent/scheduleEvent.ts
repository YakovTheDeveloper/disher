import { SyncStatus } from "@/domain/commonListItem";
import { types } from "mobx-state-tree";

export const EventItem = types.model("EventItem", {
    id: types.identifier,
    value: types.string,
    time: types.string,
    sync: types.optional(SyncStatus, {}),
    type: types.union(
        types.literal('sleep'),
        types.literal('mood'),
        types.literal('energy'),
        types.literal('custom'),
        types.literal('sport'),
        types.literal('illness'),
        types.literal('note'),
        types.literal('activity'),
        types.literal('digestion'),
    ),

}).views(self => ({
    get typeView() {
        return EventTypeView[self.type]
    }
}))
    .actions(self => ({
        updateTime(time: string) {
            self.time = time;
        },
        updateValue(value: string) {
            self.value = value;
        },
        updateType(type: ScheduleEventType) {
            self.value = ''
            self.type = type;
        },
    }));

export type ScheduleEventType = 'sleep' | 'mood' | 'energy' | 'custom' | 'sport' | 'illness' | 'note' | 'activity' | 'digestion';

const EventTypeView: Record<ScheduleEventType, string> = {
    sleep: 'Сон',
    mood: 'Настроение',
    energy: 'Энергия',
    custom: 'Кастомное событие',
    sport: 'Спорт',
    illness: 'Самочувствие',
    note: 'Заметка',
    activity: 'Активность',
    digestion: 'Пищеварение',
};