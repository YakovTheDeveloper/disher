import { makeAutoObservable, trace } from "mobx";
import { ScheduleBuilderViewModel } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { ScheduleViewModelFactory } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleCacheStore";
import { ISODate } from "@/types/common/common";
import { scheduleCache, scheduleStore } from "@/store/rootStore"; // make sure these exist
import { ScheduleEntity } from "@/store/scheduleStore/types";

export class InitLoadingStore {
    initData: ScheduleBuilderViewModel | null = null;

    constructor(
        private scheduleStoreInstance = scheduleStore,
        private scheduleCacheInstance = scheduleCache
    ) {
        makeAutoObservable(this);
    }

    set(data: ScheduleEntity) {
        this.initData = ScheduleViewModelFactory.createFromModel(data)
    }

    async onInit(date: ISODate) {

        this.initData = null

        const oldViewModel = this.scheduleCacheInstance.get(date);
        if (oldViewModel) {
            this.initData = oldViewModel;
            return;
        }

        const oldModel = this.scheduleStoreInstance.data.get(date);
        if (oldModel) {
            const newViewModel = ScheduleViewModelFactory.createFromModel(oldModel)
            this.initData = newViewModel
            return;
        }

        const { code, data = null } = await this.scheduleStoreInstance.getOneByDate(date);

        if (code === 404) {
            const newViewModel = ScheduleViewModelFactory.createFromScratch(date);
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
