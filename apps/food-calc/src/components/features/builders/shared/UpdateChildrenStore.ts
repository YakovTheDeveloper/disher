import { makeAutoObservable } from "mobx";

export type CollectionItemEntityStatusUI = 'added' | 'deleted' | 'modified' | null

export interface CollectionEntity<T> {
    items: (CollectionItemEntity & T)[];
}

export interface CollectionItemEntity {
    id: number | string;
    status: CollectionItemEntityStatusUI
}

export class UpdateChildrenStore<Parent extends CollectionEntity<Child>, Child> {

    timestamp = Date.now()

    currentId: number | string = -1;
    private getParent: () => Parent;

    get parent(): Parent {
        return this.getParent();
    }

    constructor(getCollection: () => Parent) {
        makeAutoObservable(this);
        this.getParent = getCollection;
    }

    get current() {
        console.log('current', this.parent);
        console.log('GET_CURRENT_STAMP', this.timestamp)
        return this.parent?.items.find(({ id }) => id === this.currentId) || null;
    }

    setCurrentId = (id: number | string) => {
        console.log('SET_ID_STAMP', this.timestamp);
        this.currentId = id;
    };

    resetId = () => {
        this.currentId = -1
    }

    updateCurrent = (updated: Partial<CollectionEntity<Child>['items'][number]>) => {

        if (!this.current) return;
        const finalUpdate = {
            ...updated,
            status: this.statusResolver(this.current.status)
        }
        Object.assign(this.current, finalUpdate);
        console.log('updated', this.current);
    };

    deleteChild = (childId: string | number) => {
        const item = this.parent.items.find(item => item.id === childId);
        if (!item) return

        if (item.status === 'added') {
            this.parent.items = this.parent.items.filter(i => i.id !== childId);
            return
        }
        item.status = 'deleted';
    };

    recoverDeletedChild = (childId: string | number) => {
        const item = this.parent.items.find(item => item.id === childId);
        if (!item) return

        if (item.status === 'deleted') {
            item.status = null;
        }
    };

    private statusResolver = (status: CollectionItemEntityStatusUI) => {
        if (status == null) return 'modified'
        return status
    }
}