// TODO: migrate to Triplit — DayScheduleItemUI / TimeGroupUI from ScheduleBuilderViewModel was removed
// import { DayScheduleItemUI, TimeGroupUI } from "@/components/features/builders/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { deepCopy } from "@/lib/copy/deepCopy";
import { useLocalObservable } from "mobx-react-lite";

type DayScheduleItemUI = any;
type TimeGroupUI = any;

export const useSelectStore = () => {
    const store = useLocalObservable(() => ({
        // Map of selected items (id -> item)
        content: new Map<string, DayScheduleItemUI>(),

        // Select or toggle an item
        select(item: DayScheduleItemUI, value?: boolean) {
            const id = item.id.toString()
            if (value === true) {
                this.content.set(id, item);
            } else if (value === false) {
                this.content.delete(id);
            } else {
                // toggle
                if (this.content.has(id)) {
                    this.content.delete(id);
                } else {
                    this.content.set(id, item);
                }
            }
        },

        selectAllWithDate(group: TimeGroupUI, value: boolean = true) {
            for (const item of group.items) {
                const id = item.id.toString()
                if (value) {
                    this.content.set(id, item);
                } else {
                    this.content.delete(id);
                }
            }
        },

        // Get all selected items
        getResult(): DayScheduleItemUI[] {
            return deepCopy(Array.from(this.content.values()));
        },

        // Check if item is selected
        isSelected(id: string | number): boolean {
            return this.content.has(id.toString());
        },
    }));

    return store;
};
