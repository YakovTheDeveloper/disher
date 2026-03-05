import { useStore } from '@/store/store';
import type { RootInstance } from '@/store/RootStoreModel';

export const useFoodScheduleStore = () => useStore().foodScheduleStore;
export const useEventScheduleStore = () => useStore().eventScheduleStore;
export const useFoodStore = () => useStore().foodStore;
export const useDishStore = () => useStore().dishStore;
export const useNutrientStore = () => useStore().nutrientStore;
export const useDailyNormStore = () => useStore().dailyNormStore;
export const useInteractionsService = () => useStore().interactionsService;
export const useGlobalUiStore = () => useStore().globalUiStore;
