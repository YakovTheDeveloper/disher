import { makeAutoObservable, trace } from "mobx";
import { ScheduleBuilderViewModel } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { ScheduleViewModelFactory } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleCacheStore";
import { ISODate } from "@/types/common/common";
import { scheduleCache, scheduleStore } from "@/store/rootStore"; // make sure these exist
import { ScheduleEntity } from "@/store/models/schedule/types";
import { domainStore } from "@/store/store";
import { Instance } from "mobx-state-tree";
import { DaySchedule } from "@/domain/schedule/schedule";

export class InitLoadingStore {
    initData: Instance<typeof DaySchedule> | null = null;

    constructor(
    ) {
        makeAutoObservable(this);
    }

    set(data: ScheduleEntity) {
        this.initData = ScheduleViewModelFactory.createFromModel(data)
    }

    reset() {
        this.initData = null
    }

    async onInit(date: ISODate) {

        this.initData = null

        const cached = domainStore.daySchedule.data.get(date)
        if (cached) {
            this.initData = cached;
            return;
        }

        if (!cached) {
            const { code, data = null } = await domainStore.daySchedule.getOneByDate(date);

            if (code === 404) {
                const newSchedule = domainStore.daySchedule.createLocal(data)
                this.scheduleCacheInstance.set(newViewModel);
                this.initData = newViewModel
                return;
            }

            if (data) {
                const newViewModel = ScheduleViewModelFactory.createFromModel(data);
                this.scheduleCacheInstance.set(newViewModel);
                this.initData = newViewModel;
            }
        }

    }
}
