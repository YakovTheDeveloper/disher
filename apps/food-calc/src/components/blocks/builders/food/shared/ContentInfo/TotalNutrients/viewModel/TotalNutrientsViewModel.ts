import React, { useMemo, useCallback, useImperativeHandle, Ref } from "react";
import { makeAutoObservable } from "mobx";
import { PrepareProductsForCalculationStore } from "@/components/blocks/builders/food/shared/calculationFlowStore";
import { getTotalFoodAndDishFoodQuantityFromAll } from "@/store/models/schedule/schedule.domain";
import { DayScheduleUI, makeScheduleItemsSignature } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { DaySchedule } from "@/domain/schedule/schedule";
import { Instance } from "mobx-state-tree";

export function useTotalNutrients(store: Instance<typeof DaySchedule>, ref: React.Ref<{
    calculate: () => void;
}>) {
    const prepareStore = useMemo(() => new PrepareProductsForCalculationStore(), []);

    const calculate = useCallback(() => {
        const total = getTotalFoodAndDishFoodQuantityFromAll(store.items);
        const signature = makeScheduleItemsSignature(store.items);
        console.info("Manual recalc triggered");
        console.log("total", total);
        prepareStore.onStart(total, signature);
    }, [store, store.items, prepareStore]);

    useImperativeHandle(ref, () => ({
        calculate,
    }));

    return {
        prepareStore,
    };
}
