import { nutrientsMap } from "@/store/nutrientStore/data"
import { Id } from "@/types/common/common"
import { INutrient } from "@/types/nutrient/nutrient"
import { makeAutoObservable } from "mobx"

type INutrientStore = {

}

export class NutrientStore implements INutrientStore {

    nutrinets: Record<Id, INutrient> = nutrientsMap
    currentMenuId = ''

    getNutrient = (id: number) => {
        this.nutrinets[id]
    }
}


