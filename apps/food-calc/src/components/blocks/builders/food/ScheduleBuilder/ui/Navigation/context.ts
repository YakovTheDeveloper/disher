import { scheduleStore } from "@/store/rootStore";
import { createContext, useContext } from "react";

export const NavigationContext = createContext({
    scheduleModelStore: scheduleStore,
});

export const useScheduleNavigation = () => useContext(NavigationContext);