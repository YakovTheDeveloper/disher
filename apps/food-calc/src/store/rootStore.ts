import { UiStore } from "@/store/uiStore/uiStore";

import { UserStore } from "@/store/models/user/userModelStore";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { ScheduleModelStore } from "@/store/models/schedule/scheduleModelStore";
import { DishModelStore } from "@/store/models/dish/dishModelStore";
import { FoodModelStore } from "@/store/models/food/foodModelStore";
import { ScheduleCacheStore } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleCacheStore";
import { DailyNormModelStore } from "@/store/models/dailyNorm/dailyNorm.model";

const notificationStore = new NotificationStore()

export const dailyNormModelStore = new DailyNormModelStore()
export const scheduleStore = new ScheduleModelStore()
export const dishStore = new DishModelStore()
export const foodStore = new FoodModelStore()

export const uiStore = new UiStore(notificationStore);

export const userStore = new UserStore();

export const scheduleCache = new ScheduleCacheStore()
