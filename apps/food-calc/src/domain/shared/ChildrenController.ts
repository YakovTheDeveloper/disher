import { SyncStatus } from "@/domain/commonListItem";
import { generateId } from "@/lib/id/generateId"
import { types, destroy, SnapshotIn, IAnyModelType, IModelType } from "mobx-state-tree"

export function ChildrenController<T extends IAnyModelType>(
  ChildModel: T,
) {
  return types
    .model({
      items: types.array(ChildModel),
    })
    .views(self => ({
      get delta() {
        const items = self.items;
        const added = items.filter(i => i.sync.status === "added")
        const modified = items.filter(i => i.sync.status === "modified")
        const deleted = items
          .filter(i => i.sync.status === "deleted")
          .map(i => i.id)

        return { added, modified, deleted }
      },
    }))
    .actions(self => ({
      getChildById(id: string) {
        return self.items.find(i => i.id === id)
      },

      addChildWithLocalData(data: Partial<SnapshotIn<T>>) {
        const child = ChildModel.create({ id: generateId(), ...data })
        child.sync.markAdded()
        self.items.push(child)
        return child
      },

      addChildWithServerData(data: Partial<SnapshotIn<T>>) {
        const child = ChildModel.create(data)
        self.items.push(child)
        return child
      },

      updateChildById(
        fields: Partial<SnapshotIn<T>>,
        markModified = true
      ) {
        if (fields.id == null) throw new Error('updateChildById: no id in fields')

        const child = self.items.find(i => i.id === fields.id)
        if (!child) return

        Object.assign(child, fields)
        if (markModified) child.sync.markModified()
        return child
      },

      removeChild(childId: string) {
        const item = self.items.find(i => i.id === childId);
        if (!item) return;
        if (!item.sync.lastSync) {
          self.items.replace(self.items.filter(i => i.id !== childId));
          return;
        }
        item.sync.markDeleted();
      },

      removeChildren(childIds: string[]) {
        const toRemove: string[] = [];
        childIds.forEach(childId => {
          const item = self.items.find(i => i.id === childId);
          if (!item) return;
          if (!item.sync.lastSync) {
            toRemove.push(childId);
          } else {
            item.sync.markDeleted();
          }
        });
        if (toRemove.length > 0) {
          self.items.replace(self.items.filter(i => !toRemove.includes(i.id)));
        }
      },

      removeChildrenMarkedAsDeleted() {
        self.items
          .filter(i => i.sync.status === "deleted")
          .forEach(destroy)
      },

      addOrUpdateBulk(inputChildren: Partial<SnapshotIn<T>>[]) {
        const now = Date.now().toString()

        inputChildren.forEach(child => {
          const localChild = this.updateChildById(child)

          if (localChild) {
            localChild.sync.onSync(now)
          } else {
            this.addChildWithServerData(child)
          }
        })
      },

    }))
}
