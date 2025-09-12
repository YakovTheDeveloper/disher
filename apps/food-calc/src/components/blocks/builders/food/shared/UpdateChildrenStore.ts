import { Suggestion } from "./ModalStoreUI";
import { makeAutoObservable } from "mobx";

export interface CollectionEntity<T> {
    items: (CollectionItemEntity & T)[];
}

export interface CollectionItemEntity {
    id: number | string;
    quantity: number;
}

type localObject = { id: string }

export class UpdateChildrenStore<Parent extends CollectionEntity<Child>, Child> {
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
        return this.collection?.items.find(({ id }) => id === this.currentId) || null;
    }

    setCurrentId = (id: number | string) => {
        this.currentId = id;
    };

    resetId = () => {
        this.currentId = -1
    }

    updateCurrent = (updated: Partial<CollectionEntity<Child>['items'][number]>) => {
        if (!this.current) return;
        console.log(updated);
        Object.assign(this.current, updated);
    };
}