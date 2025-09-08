import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { FetchManager } from "@/store/common/FetchManagerStore";
import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { Response } from "@/types/api/common";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

export interface UserDataStore<Data> {
  detectChangesStore: DetectChangesStore<Data>;
  remove: (id: number) => Promise<Response<boolean>>;
  resetToInit: () => void;
  save: (id: number) => Promise<Response<Data>>;
  id: number;
  empty: boolean;
  name: string;
}

export interface DraftStore<Data> {
  resetToInit: () => void;
  save: () => Promise<Response<Data>>;
  empty: boolean;
  name: string;
}

export interface RootEntity<Data = any> {
  save: (payload: any) => Promise<Response<Data>>,
  update: (id: number, payload: any) => Promise<Response<Data>>,
  remove: (id: number, payload: any) => Promise<Response<Data>>,
  getAll: () => Promise<Response<Data>>,
}






















type CommonEntityStore = {
  id: number
}




export abstract class RootEntityStore<
  RawEntity extends CommonEntityStore,
  StoreEntity extends CommonEntityStore,
  DraftStoreEntity extends CommonEntityStore
> {
  constructor(
    private MainEntity: new (data: RawEntity) => StoreEntity
  ) {
    makeObservable(this, {
      currentItemId: observable,
      loadingState: observable,
      userStores: observable,
      addLocalBulk: action,
      removeLocal: action,
      addLocal: action,
      setCurrentId: action,
      userStoresMap: computed,
      currentStore: computed,
      stores: computed
    })
  }

  protected abstract fetchManager: FetchManager<RawEntity>

  loadingState = new LoadingStateStore()

  abstract draftStore: DraftStoreEntity

  userStores: StoreEntity[] = []

  currentItemId = -1

  get stores() {
    return [this.draftStore, ...this.userStores];
  }

  get currentStore() {
    return this.stores.find(({ id }) => id === this.currentItemId);
  }

  get userStoresMap() {
    return this.userStores.reduce(
      (acc, store) => {
        acc[store.id] = store;
        return acc;
      },
      {} as Record<string, StoreEntity>
    );
  }


  addLocal(store: StoreEntity): void;
  addLocal(params: { store: StoreEntity; index?: number }): void;
  addLocal(arg: StoreEntity | { store: StoreEntity; index?: number }): void {
    if ('store' in arg) {
      const { store, index } = arg;
      if (index == null) {
        this.userStores.push(store);
        return;
      }
      this.userStores.splice(index, 0, store);
    } else {
      this.userStores.push(arg);
    }
  }


  addLocalBulk = (content: StoreEntity[]) => {
    runInAction(() => {
      content.forEach(store => {
        if (this.userStoresMap[store.id]) {
          return
        }
        this.userStores.push(store)
      })
    })
  }

  removeLocal = (storeId: number) => {
    const index = this.userStores.findIndex(({ id }) => +id === storeId);
    if (index === -1) return null;

    const [store] = this.userStores.splice(index, 1);

    return { store, index };
  };

  setCurrentId = (id: number) => {
    this.currentItemId = id;
  };

  createChildStore = (data: RawEntity) => {
    return new this.MainEntity(data);
  }
}
