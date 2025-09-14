import { createLocalSchedule, ScheduleBuilderViewModel } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { makeAutoObservable } from "mobx";

type ISODate = string

export class ScheduleCacheStore {
    constructor() {
        makeAutoObservable(this);
    }

    viewmodels: Map<ISODate, ScheduleBuilderViewModel> = new Map()

    set = (vm: ScheduleBuilderViewModel) => {
        this.viewmodels.set(vm.date, vm)
    }

    remove = (vm: ScheduleBuilderViewModel) => {
        this.viewmodels.delete(vm.date)
    }

    createAndSet = (date: string) => {
        const seed = createLocalSchedule(date || '');
        const init = new ScheduleBuilderViewModel(seed)
        this.set(init)
        return init
    }

    // getCachedOrNew = () => {
    //     const cached = schedulesCache.viewmodels.get(initDate)
    //     if (cached) {
    //         return cached
    //     }
    //     schedulesCache.viewmodels.get(initDate)
    // }
}
