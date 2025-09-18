import { DayScheduleItemUIStatus } from "@/components/blocks/builders/food/ScheduleBuilder/model/ScheduleBuilderViewModel";
import { Suggestion } from "./ModalStoreUI";
import { makeAutoObservable, toJS } from "mobx";

export interface CollectionEntity<T> {
    items: (CollectionItemEntity & T)[];
}

export interface CollectionItemEntity {
    id: number | string;
    quantity: number;
    status: DayScheduleItemUIStatus
}

export class UpdateChildrenStore<Parent extends CollectionEntity<Child>, Child> {

    timestamp = Date.now()

    currentId: number | string = -1;
    private getCollection: () => Parent;

    get collection(): Parent {
        return this.getCollection();
    }

    constructor(getCollection: () => Parent) {
        makeAutoObservable(this);
        this.getCollection = getCollection;
    }

    get current() {
        console.log('GET_CURRENT_STAMP', this.timestamp)
        return this.collection?.items.find(({ id }) => id === this.currentId) || null;
    }

    setCurrentId = (id: number | string) => {
        console.log('SET_ID_STAMP', this.timestamp);
        this.currentId = id;
    };

    resetId = () => {
        this.currentId = -1
    }

    updateCurrent = (updated: Partial<CollectionEntity<Child>['items'][number]>) => {
        console.log(updated, this.current);

        if (!this.current) return;
        const finalUpdate = {
            ...updated,
            status: this.statusResolver(this.current.status)
        }
        Object.assign(this.current, finalUpdate);
    };

    private statusResolver = (status: DayScheduleItemUIStatus) => {
        if (status == null) return 'modified'
        return status
    }
}