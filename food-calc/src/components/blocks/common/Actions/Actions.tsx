import Button from "@/components/ui/Button/Button";
import React from "react";
import s from "./Actions.module.css";
import { DetectChangesStore } from "@/store/common/DetectChangesStore";
import { observer } from "mobx-react-lite";
import { DraftStore, UserDataStore } from "@/store/common/types";
import Spinner from "@/components/ui/Spinner/Spinner";

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

type Props = {
  store: UserDataStore<any> | DraftStore;
};

const Actions = ({ store }: Props) => {
  const { loading } = store;
  if ("detectChangesStore" in store) {
    const { empty, remove, save, detectChangesStore, resetToInit, id } = store;
    return (
      <UserActions
        detectChangesStore={detectChangesStore}
        id={id.toString()}
        isEmpty={empty}
        remove={remove}
        resetToInit={resetToInit}
        save={save}
        loading={loading}
      />
    );
  }

  const { resetToInit, empty, save } = store;
  return (
    <DraftActions
      resetToInit={resetToInit}
      isEmpty={empty}
      save={save}
      loading={loading}
    />
  );
};

export const DraftActions = observer(
  ({ save, resetToInit, isEmpty, loading }: DraftProps) => {
    return (
      <div className={s.container}>
        <span className={s.loading}>{loading && <Spinner />}</span>
        <Button className={s.mainButton} onClick={save} disabled={loading}>
          Сохранить
        </Button>
        {!isEmpty && (
          <Button onClick={resetToInit} variant="danger" disabled={loading}>
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
        <span className={s.loading}>{loading && <Spinner />}</span>
        <IfContentChange changeOccured={detectChangesStore.changeOccured}>
          <Button
            className={s.mainButton}
            onClick={() => save(+id)}
            disabled={loading}
          >
            Обновить
          </Button>
        </IfContentChange>
        <IfContentChange changeOccured={detectChangesStore.changeOccured}>
          <Button onClick={resetToInit} variant="danger" disabled={loading}>
            Отменить изменения
          </Button>
        </IfContentChange>
        <Button onClick={() => remove(+id)} variant="danger" disabled={loading}>
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
