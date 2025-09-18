import { createLocalSchedule, DayScheduleUI, ScheduleBuilderViewModel } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { ScheduleEntity } from "@/store/scheduleStore/types";
import { DaySchedule } from "@/types/schedule";
import { makeAutoObservable } from "mobx";

type ISODate = string

export class ScheduleCacheStore {
    constructor() {
        makeAutoObservable(this);
    }

    viewmodels: Map<ISODate, ScheduleBuilderViewModel> = new Map()

    set = (vm: ScheduleBuilderViewModel) => {
        this.viewmodels.set(vm.date, vm)
        return vm
    }

    remove = (vm: ScheduleBuilderViewModel) => {
        this.viewmodels.delete(vm.date)
    }

    get = (date: string) => {
        const cached = this.viewmodels.get(date)
        if (cached) return cached
    }

    // getCachedOrNew = () => {
    //     const cached = schedulesCache.viewmodels.get(initDate)
    //     if (cached) {
    //         return cached
    //     }
    //     schedulesCache.viewmodels.get(initDate)
    // }
}

export class ScheduleViewModelFactory {
    static createFromScratch = (date: string) => {
        return new ScheduleBuilderViewModel({
            date,
            id: -1,
            items: [],
            questionnaire: null
        })
    }
    static createFromModel = (data: ScheduleEntity) => {
        return new ScheduleBuilderViewModel(data)
    }
}