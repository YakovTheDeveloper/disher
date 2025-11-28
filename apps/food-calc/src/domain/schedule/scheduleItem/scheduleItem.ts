import { ScheduleItem } from "@/domain/schedule/schedule";
import { Instance } from "mobx-state-tree";

export function makeScheduleItemsSignature(items: Instance<typeof ScheduleItem>[]): string {
    return items
        .map((i) => {
            return [
                `id:${i.id}`,
                `qty:${i.quantity}`,
                `type:${i.content.type}`
            ].join(";");
        })
        .join("||");
}
