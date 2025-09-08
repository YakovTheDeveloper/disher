import { LOCAL_STORAGE_KEYS } from "@/constants";
import { loadFromLocalStorage, persistToLocalStorage } from "@/lib/storage/localStorage";
import { NutrientGroupName } from "@/types/nutrient/nutrient";
import { makeAutoObservable, reaction, toJS } from "mobx";

export class NutrientUiStore {
    constructor() {

        const state = loadFromLocalStorage(LOCAL_STORAGE_KEYS.NutrientUiStore) as {
            nutrientGroupsVisibility: Record<NutrientGroupName, boolean>,
            nutrientsVisibility: Record<string, boolean>
        }

        if (state) {
            this.nutrientGroupsVisibility = state.nutrientGroupsVisibility
            this.nutrientsVisibility = state.nutrientsVisibility
        }

        makeAutoObservable(this);

        reaction(
            () => [
                toJS(this.nutrientGroupsVisibility),
                toJS(this.nutrientsVisibility),
            ],
            ([groups, nutrients]) => {

                persistToLocalStorage(LOCAL_STORAGE_KEYS.NutrientUiStore, {
                    [LOCAL_STORAGE_KEYS.nutrientGroupsVisibility]: groups,
                    [LOCAL_STORAGE_KEYS.nutrientsVisibility]: nutrients,
                });
            }
        );
    }

    nutrientGroupsVisibility: Record<NutrientGroupName, boolean> = {
        main: true,
        vitaminsB: true,
        minerals: true,
        rest: true
    }

    nutrientsVisibility: Record<string, boolean> = {
        protein: true,
        fats: true,
        carbohydrates: true,
        sugar: true,
        starch: true,
        fiber: true,
        energy: true,
        water: true,
        vitaminB1: true,
        vitaminB2: true,
        vitaminB3: true,
        vitaminB4: true,
        vitaminB5: true,
        vitaminB6: true,
        vitaminB7: true,
        vitaminB9: true,
        vitaminB12: true,
        iron: true,
        magnesium: true,
        phosphorus: true,
        calcium: true,
        potassium: true,
        sodium: true,
        zinc: true,
        copper: true,
        manganese: true,
        selenium: true,
        iodine: true,
        vitaminA: true,
        vitaminC: true,
        vitaminD: true,
        vitaminE: true,
        vitaminK: true,
        betaCarotene: true,
        alphaCarotene: true,
    }

    toggleShowNutrientGroup = (groupName: NutrientGroupName) => {
        this.nutrientGroupsVisibility[groupName] = !this.nutrientGroupsVisibility[groupName]
    }

    toggleNutrient = (nutrientName: string) => {
        this.nutrientsVisibility[nutrientName] = !this.nutrientsVisibility[nutrientName]
    }
}