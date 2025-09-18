import { updateSchedule } from "@/api/schedule/schedule.api";
import { DayScheduleUI } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { ScheduleQuestionnaire } from "@/store/scheduleStore/types";
import { makeAutoObservable } from "mobx";

export class QuestionnaireViewModel {
    private getSchedule: () => DayScheduleUI;

    content: ScheduleQuestionnaire;

    constructor(getSchedule: () => DayScheduleUI) {
        this.getSchedule = getSchedule;

        const init = getSchedule().questionnaire;
        const content = init || createQuestionnaire()

        console.log("content", content);
        this.content = content;

        makeAutoObservable(this);
    }

    set = <K extends keyof ScheduleQuestionnaire>(
        field: K,
        value: ScheduleQuestionnaire[K]
    ) => {
        this.content[field] = value;
    };

    addMood = (value: number, time: string) => {
        this.content.mood ??= [];
        this.content.mood.push({ value, time });
    };

    addEnergy = (value: number, time: string) => {
        this.content.energy ??= [];
        this.content.energy.push({ value, time });
    };

    addDigestion = (
        symptom: keyof NonNullable<ScheduleQuestionnaire["digestion"]>,
        value: number,
        time: string
    ) => {
        this.content.digestion ??= {};
        this.content.digestion[symptom] ??= [];
        this.content.digestion[symptom]!.push({ value, time });
    };

    addActivity = (type: string, duration_min: number, time: string) => {
        this.content.activity ??= [];
        this.content.activity.push({ type, duration_min, time });
    };

    setNotes = (notes: string) => {
        this.content.notes = notes;
    };

    setSleep = (hours: number, quality: number) => {
        this.content.sleep = { hours, quality };
    };

    addCraving = (craving: string) => {
        this.content.cravings ??= [];
        if (!this.content.cravings.includes(craving)) {
            this.content.cravings.push(craving);
        }
    };

    removeCraving = (craving: string) => {
        this.content.cravings ??= [];
        this.content.cravings = this.content.cravings.filter((c) => c !== craving);
    };

    toJSON = (): string => {
        return JSON.stringify(this.content);
    };

    onFinish = async () => {
        const schedule = this.getSchedule()
        await updateSchedule({
            questionnaire: this.content
        }, schedule.id)
    }
}

export const createQuestionnaire = (): ScheduleQuestionnaire => {
    return {
        cravings: [],
        sleep: { quality: undefined, hours: undefined },
        mood: [],
        energy: [],
        digestion: {
            bloating: [],
            stomach_pain: [],
            heartburn: [],
            constipation: [],
            diarrhea: [],
        },
        activity: [],
        notes: "",
    };
};
