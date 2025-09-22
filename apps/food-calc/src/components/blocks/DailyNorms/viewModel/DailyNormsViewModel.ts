import { nutrientGroups } from "@/components/blocks/builders/food/shared/ContentInfo/Nutrients/constants";
import { CollectionItemEntityStatusUI, UpdateChildrenStore } from "@/components/blocks/builders/food/shared/UpdateChildrenStore";
import { deepCopy } from "@/lib/copy/deepCopy";
import { DailyNormEntity, DailyNormItemEntity } from "@/store/models/dailyNorm/dailyNorm.types"
import { uiStore } from "@/store/rootStore";
import { DailyNormsStoreUI } from "@/store/uiStore/dailyNorms/DailyNormsStoreUI";
import { defaultNorms, STANDARD_NORM_ID, STANDARD_NORM_ID_2 } from "@/store/uiStore/dailyNorms/data";
import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from 'uuid';

export type DailyNormEntityUI = Omit<DailyNormEntity, 'items' | 'id'> & {
    items: DailyNormItemEntity[]
    id: number | string
}

export class DailyNormsViewModel {
    constructor(raw: DailyNormEntity[], private store: DailyNormsStoreUI = uiStore.dailyNorms) {
        this.items = raw.map(toUIAdapter)
        makeAutoObservable(this)
    }

    currentId: number | string = -1;

    get current() {
        const matchId = (item: { id: unknown }) => item.id === this.currentId
        return this.items.find(matchId) || this.defaults.find(matchId) || null;
    }

    setCurrentId = (id: number | string) => {
        this.currentId = id;
    };

    defaults: DailyNormEntityUI[] = this.store.defaultNormsCollection

    items: DailyNormEntityUI[] = []

    updateCurrentNormNutrient = (nutrientId: number, quantity: number) => {
        if (!this.current) return;
        const normItemChild = this.current.items.find((item) => nutrientId === item.nutrientId)
        if (!normItemChild) return
        normItemChild.quantity = quantity
    };

    updateCurrentName = (name: string) => {
        if (!this.current) return;
        this.current.name = name
    };

    updateCurrentDescription = (description: string) => {
        if (!this.current) return;
        this.current.description = description
    };

    addChild = () => {
        const item = createDailyNormItemEntityUI()
        this.items.push(item);
        return item.id
    }

    payload = (): DailyNormEntityUI | null => {
        return this.current
    }
}

function toUIAdapter(raw: DailyNormEntity): DailyNormEntityUI {
    const copy = deepCopy(raw);
    return {
        ...copy,
    };
}

function createDailyNormItemEntityUI(): DailyNormEntityUI {
    return {
        description: '',
        name: 'Моя норма',
        items: nutrientGroups.flatMap(({ content }) => content.map(({ id }) => ({
            nutrientId: id,
            quantity: null
        }))),
        id: uuidv4(),
    }
}