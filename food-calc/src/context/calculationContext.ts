import { currentCalculationStore } from "@/store/rootStore";
import { createContext } from "react";

export const DayCalculationContext = createContext({
    updateCalculations: currentCalculationStore.updateDayCalculationsWithCurrentProducts
});