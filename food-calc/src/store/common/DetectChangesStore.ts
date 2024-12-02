import { isEqual } from "@/utils/comparison";
import { makeAutoObservable, reaction, toJS } from "mobx";

export class DetectChangesStore<DataType> {
  constructor(observableData: DataType) {
    makeAutoObservable(this);
    this.data = observableData;
    this.setInitSnapshot(this.data);

    reaction(
      () => [toJS(this.initSnapshot), toJS(this.data)],
      ([snapshot, data]) => {
        console.log("snapshot", snapshot, data, snapshot === data);
        this.changeOccured = !isEqual(snapshot, data);
      }
    );
  }

  // check
  private data: DataType | null = null;
  changeOccured = false;
  initSnapshot: DataType | null = null;

  setData = (data: DataType) => {
    this.data = data;
  };

  setInitSnapshot = (data: DataType) => {
    this.initSnapshot = structuredClone(toJS(data));
  };

  updateSnapshot = (data: DataType) => {
    this.initSnapshot = structuredClone(toJS(data));
    this.changeOccured = false;
  };

  get initProductsSnapshot() {
    return this.initSnapshot;
  }

  get initProductsSnapshotCopy() {
    return structuredClone(toJS(this.initSnapshot));
  }
  // resetToInit = () => {
  //     if (!this.initSnapshot) return;
  //     this.data = structuredClone(toJS(this.initSnapshot));
  //     this.changeOccured = false;
  // };
}
