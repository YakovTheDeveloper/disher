import { RequestState } from "@/api/RequestState";
import { getSchedules, updateSchedule, createSchedule, deleteSchedule, getOneSchedule, addSchedule } from "@/api/schedule/schedule.api";
import { DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { ScheduleEntity } from "@/store/scheduleStore/types";
import { ISODate } from "@/types/common/common";
import { makeAutoObservable } from "mobx";

export class ScheduleStore {
    data: Map<ISODate, ScheduleEntity> = new Map();

    constructor() {
        makeAutoObservable(this);
        this.getAll();
    }

    requestState = {
        getOneByDate: new Map<ISODate, RequestState>(),
        createOrUpdate: new Map<ISODate, RequestState>(),
    }

    private addLocal = (data: ScheduleEntity) => {
        this.data.set(data.date, data);
    }

    getAll = async () => {
        const res = await getSchedules(new Date().toISOString());
        console.log("res.data", res);
        if (!res.data) return;
        this.data.clear();
        res.data.forEach((schedule: ScheduleEntity) => {
            this.addLocal(schedule);
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
    };

    set = async (date: string, schedule: ScheduleEntity) => this.data.set(date, schedule);
    delete = async (date: string) => this.data.delete(date);

}
