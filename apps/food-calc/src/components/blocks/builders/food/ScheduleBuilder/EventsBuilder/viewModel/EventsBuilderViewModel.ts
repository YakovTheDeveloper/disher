import { DayScheduleItemUIStatus, TimeGroupUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { UpdateChildrenStore } from "@/components/blocks/builders/food/shared/UpdateChildrenStore";
import { groupByTimeAndSort } from "@/lib/time/groupByTimeAndSort";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from 'uuid';

import { DailyEventData } from "@types";

export type ScheduleQuestionnaire = {
    items: ScheduleQuestionnaireItemUI[];
};

export type ScheduleQuestionnaireItemUI = {
    id: string | number
    status: DayScheduleItemUIStatus
    data: DailyEventData
    time: string
};

// function dailyEventsToUIAdapter(data?: string | null): ScheduleQuestionnaire {
//     return data ? JSON.parse(data) : {
//         items: []
//     }
// }

export class DayEventsBuilderViewModel {
    constructor(data: ScheduleQuestionnaireItemUI[] | null) {
        this.content = {
            items: data ?? []
        }
        this.children = new UpdateChildrenStore(() => this.content)

        makeAutoObservable(this)
    }

    children: UpdateChildrenStore<ScheduleQuestionnaire, ScheduleQuestionnaireItemUI>

    content: ScheduleQuestionnaire;

    add = (data: DailyEventData) => {
        this.content.items.push(createLocal(data))
    }

    // update = (data: Partial<DailyEventVariants>) => {
    //     const current = this.children.current
    //     if (!current) {
    //         return
    //     }
    //     this.children.updateCurrent({
    //         content: data
    //     })
    //     current.content = data
    // }

    get itemsLength() {
        return this.content.items.length
    }

    get itemsGroupedByTime(): TimeGroupUI<ScheduleQuestionnaireItemUI>[] {
        return groupByTimeAndSort(this.content.items)
    }

    payload = () => {
        return this.content.items
    }
}

const createLocal = (data: DailyEventData): ScheduleQuestionnaireItemUI => {
    return {
        id: uuidv4(),
        data,
        status: 'added',
        time: '00:00'
    };
};

export const eventVariantToView = {
    sleep: 'сон',
    mood: 'настроение',
    energy: 'уровень энергии',
    digestion: 'пищеварение',
    activity: 'активность',
    note: 'сон',
}
