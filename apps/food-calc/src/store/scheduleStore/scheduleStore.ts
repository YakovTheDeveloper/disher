import { getSchedules, updateSchedule, createSchedule, deleteSchedule } from "@/api/schedule/schedule.api";
import { ScheduleEntity } from "@/store/scheduleStore/types";
import { makeAutoObservable } from "mobx";

export class ScheduleStore {
    data: Map<string, ScheduleEntity> = new Map();

    constructor() {
        makeAutoObservable(this);
        this.getAll();
    }

    get dateToSchedule() {
        return new Map(this.data);
    }

    getAll = async () => {
        const res = await getSchedules(new Date().toISOString());
        console.log("res.data", res);
        if (!res.data) return;
        this.data.clear();
        res.data.forEach((schedule: ScheduleEntity) => {
            this.data.set(schedule.date, schedule);
        });
    };

    set = async (date: string, schedule: ScheduleEntity) => this.data.set(date, schedule);
    delete = async (date: string) => this.data.delete(date);
}
