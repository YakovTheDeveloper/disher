import { makeAutoObservable } from "mobx";
import { ISODate } from "@/types/common/common";
import { ModalStore } from "@/store/uiStore/modalStore/modalStore";
import { NotificationStore } from "@/store/uiStore/notificationStore/notificationStore";
import { defaultNutrientsV2 } from "@/store/nutrientStore/data";
import { NutrientGroupName } from "@/types/nutrient/nutrient";
import { NutrientUiStore } from "@/store/uiStore/nutrientUiStore/nutrientUiStore";
import { DishUiStore } from "@/store/uiStore/dishUiStore/dishUiStore";
import { MenuUiStore } from "@/store/uiStore/menu/menuUiStore";

export type NotificationData = {
  id: number
  variant: 'success' | 'error'
  message: string
}

export type DayContent = 'day' | 'calendar'

export class UiStore {

  dayCalendarDate: ISODate = new Date().toISOString()

  // tooltip = new TooltipStore()

  setDayCalendarDate = (date: ISODate) => { this.dayCalendarDate = date }

  notification: NotificationStore
  modal: ModalStore

  nutrients: NutrientUiStore

  dishUi: DishUiStore
  menu: MenuUiStore

  // day = {
  //   showDishChoice: false
  // }

  constructor(
    notification: NotificationStore,
    modal: ModalStore,
    nutrient: NutrientUiStore,
    dishUiStore: DishUiStore,
    menu: MenuUiStore
  ) {
    this.notification = notification
    this.modal = modal
    this.nutrients = nutrient
    this.dishUi = dishUiStore
    this.menu = menu
    makeAutoObservable(this);
  }
}
