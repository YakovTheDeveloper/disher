import { RequestState } from "@/api/RequestState";
import { getSchedules, updateSchedule, getOneSchedule, addSchedule } from "@/api/schedule/schedule.api";
import { ScheduleQuestionnaireItemUI } from "@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel";
import { DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { ScheduleEntity } from "@/store/models/schedule/types";
import { ISODate } from "@/types/common/common";
import { makeAutoObservable } from "mobx";

type DateAndIdScheduleEntity = Pick<ScheduleEntity, 'date' | 'id'>

export class ScheduleModelStore {
    data: Map<ISODate, ScheduleEntity> = new Map();

    existing: Map<ISODate, boolean> = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    requestState = {
        getOneByDate: new Map<ISODate, RequestState>(),
        createOrUpdate: new Map<ISODate, RequestState>(),
        updateDailyEvents: new Map<ISODate, RequestState>(),
    }

    private addLocal = (data: ScheduleEntity) => {
        this.data.set(data.date, data);
    }

    private addExisting = (data: ScheduleEntity) => {
        this.existing.set(data.date, Boolean(data));
    }

    getAllMonthShortData = async (date: Date) => {
        const res = await getSchedules(date.toISOString());
        console.log("res.data", res);
        if (!res.data) return;
        this.data.clear();
        res.data.forEach((schedule: ScheduleEntity) => {
            this.addExisting(schedule);
        });
    };

    getOneByDate = async (date: ISODate) => {
        const requestState = new RequestState(date)
        this.requestState.getOneByDate.set(date, requestState)
        const res = await getOneSchedule({ date });
        if (!res.data) {
            requestState.fail('', res.code)
        } else {
            requestState.success(res.code)
            this.addLocal(res.data);
        }
        return {
            data: res.data,
            ...requestState.raw()
        }

    };

    create = async (payload: DayScheduleUI) => {
        const { date } = payload
        const requestState = new RequestState(date)
        this.requestState.createOrUpdate.set(date, requestState)
        const res = await addSchedule(payload);
        if (!res.data) {
            requestState.fail('', res.code)
            this.requestState.createOrUpdate.delete(date)
        } else {
            requestState.success(res.code)
            this.addLocal(res.data);
        }
        return {
            data: res.data,
            ...requestState.raw()
        }
    };

    update = async (payload: DayScheduleUI) => {
        const { date } = payload
        const requestState = new RequestState(date)
        this.requestState.createOrUpdate.set(date, requestState)
        const res = await updateSchedule(payload, payload.id);
        if (!res.data) {
            requestState.fail('', res.code)
            this.requestState.createOrUpdate.delete(date)
        } else {
            requestState.success(res.code)
            this.addLocal(res.data);
        }
        return {
            data: res.data,
            ...requestState.raw()
        }
    }

    // updateDailyEvents = async (date: ISODate, payload: ScheduleQuestionnaireItemUI[]) => {
    //     const requestState = new RequestState('')
    //     this.requestState.updateDailyEvents.set(date, requestState)
    //     const res = await updateDailyEvents(date, payload);
    //     if (!res.data) {
    //         requestState.fail('', res.code)
    //         this.requestState.createOrUpdate.delete(date)
    //     } else {
    //         requestState.success(res.code)
    //         this.addLocal(res.data);
    //     }
    //     return {
    //         data: res.data,
    //         ...requestState.raw()
    //     }
    // }

    updateDailyEventsLocal = (date: ISODate, payload: string | null) => {
        const item = this.data.get(date)
        if (!item) return
        item.questionnaire = payload
    }

    set = async (date: string, schedule: ScheduleEntity) => this.data.set(date, schedule);
    delete = async (date: string) => this.data.delete(date);

}
