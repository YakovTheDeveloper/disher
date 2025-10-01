import React, { useMemo, useCallback, useImperativeHandle, Ref } from "react";
import { makeAutoObservable } from "mobx";
import { PrepareProductsForCalculationStore } from "@/components/blocks/builders/food/shared/calculationFlowStore";
import { getTotalFoodAndDishFoodQuantityFromAll } from "@/store/models/schedule/schedule.domain";
import { DayScheduleUI, makeScheduleItemsSignature } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";

export function useTotalNutrients(vm: {
    schedule: DayScheduleUI;
}, ref: React.Ref<{
    calculate: () => void;
}>) {
    const prepareStore = useMemo(() => new PrepareProductsForCalculationStore(), []);

    const calculate = useCallback(() => {
        const total = getTotalFoodAndDishFoodQuantityFromAll(vm.schedule.items);
        const signature = makeScheduleItemsSignature(vm.schedule.items);
        console.info("Manual recalc triggered");
        console.log("total", total);
        prepareStore.onStart(total, signature);
    }, [vm, vm.schedule.items, prepareStore]);

    useImperativeHandle(ref, () => ({
        calculate,
    }));

    return {
        prepareStore,
    };
}
