import Button from "@/components/ui/Button/Button";
import React from "react";
import s from "./Actions.module.css";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { observer } from "mobx-react-lite";
import { DraftStore, UserDataStore } from "@/store/common/types";
import Spinner from "@/components/ui/Spinner/Spinner";
import { uiStore } from "@/store/rootStore";
import { notificationMessages } from "@/components/ui/Notification/NotificationMessages";
import { EntityNames, Operations } from "@/types/common/common";
import { Response } from "@/types/api/common";
import { LoadingStateStore } from "@/store/common/LoadingStateStore";
import { toJS } from "mobx";

type DraftProps = {
  save: () => void;
  resetToInit: () => void;
  isEmpty: boolean;
  loading: boolean;
};

type UserProps = {
  id: string;
  detectChangesStore: DetectChangesStore<any>;
  remove: (id: number) => void;
  save: (id: number) => void;
  resetToInit: () => void;
  isEmpty: boolean;
  loading: boolean;
};

type Props<Data> = {
  store: UserDataStore<any> | DraftStore<any>;
  // store: UserDataStore<any> | DraftStore<any>;
  variant: EntityNames
  loadingState: LoadingStateStore

  actions?: {
    onSave: () => Promise<Response<any>>
    onDelete: (id: number) => Promise<Response<any>>
    onUpdate: (id: number) => Promise<Response<any>>
    onSaveEnd?: (res: Response<any>) => void
    onDeleteEnd?: (res: Response<any>) => void
    onUpdateEnd?: (res: Response<any>) => void
  }
  detectChangesStore: DetectChangesStore<any>
};

type OnAction = {
  save: () => Promise<Response<any>>,
  op: 'save'
} | {
  remove: (id: number) => Promise<Response<any>>
  id: number
  op: 'delete'
} | {
  save: (id: number) => Promise<Response<any>>
  id: number
  op: 'update'
}

const Actions = ({ store, variant, loadingState, actions }: Props) => {

  const { notification } = uiStore
  const { name } = store;

  const notificationCb = (res: Response<any>, op: Operations) => {
    if (res.isError) {
      notification.error(variant, op, name)
      return
    }
    notification.success(variant, op, name)
  }

  const onAction = (data: OnAction) => {
    const { op } = data
    if (op === 'save') {
      data.save().then((res) => {
        notificationCb(res, op)
        actions?.onSaveEnd?.(res)
      })
    }
    if (op === 'delete') {
      const { id } = data
      data.remove(id).then((res) => {
        notificationCb(res, op)
        actions?.onDeleteEnd?.(res)
      })
    }
    if (op === 'update') {
      const { id } = data
      data.save(id).then((res) => {
        notificationCb(res, op)
        actions?.onUpdateEnd?.(res)
      })
    }
  }


  if ("detectChangesStore" in store) {
    const { empty, remove, save, detectChangesStore, resetToInit, id } = store;
    const loading = loadingState.getLoading('delete', store.id) || loadingState.getLoading('update', store.id)

    return (
      <UserActions
        detectChangesStore={detectChangesStore}
        id={id.toString()}
        isEmpty={empty}
        remove={() => onAction({ remove, id, op: 'delete' })}
        resetToInit={resetToInit}
        save={() => onAction({ save, id, op: 'update' })}
        loading={loading}
      />
    );
  }

  const { resetToInit, empty, save } = store;
  const loading = loadingState.getLoading('save')

  return (
    <DraftActions
      resetToInit={resetToInit}
      isEmpty={empty}
      save={() => onAction({ save, op: 'save' })}
      loading={loading}
    />
  );
};

export const DraftActions = observer(
  ({ save, resetToInit, isEmpty, loading }: DraftProps) => {
    return (
      <div className={s.container}>
        {loading && <span className={s.loading}>{loading && <Spinner />}</span>}
        <Button className={s.mainButton} onClick={save} disabled={loading}>
          Сохранить
        </Button>
        {!isEmpty && (
          <Button onClick={resetToInit} variant="danger" disabled={loading} className={s.deleteButton}>
            Сбросить
          </Button>
        )}
      </div>
    );
  }
);

export const UserActions = observer(
  ({
    id,
    detectChangesStore,
    remove,
    save,
    resetToInit,
    isEmpty,
    loading,
  }: UserProps) => {
    return (
      <div className={s.container}>
        <Button
          className={s.mainButton}
          onClick={() => save(+id)}
          disabled={loading}
        >
          Обновить
        </Button>
        <span className={s.loading}>{loading && <Spinner />}</span>
        <IfContentChange changeOccured={detectChangesStore.changeOccured}>
          <Button onClick={resetToInit} variant="danger" disabled={loading}>
            Отменить изменения
          </Button>
        </IfContentChange>
        <Button onClick={() => remove(+id)} variant="danger" disabled={loading} className={s.deleteButton}>
          Удалить
        </Button>
      </div>
    );
  }
);

function IfContentChange({ changeOccured, children }) {
  if (!changeOccured) return null;
  return children;
}

export default observer(Actions);
