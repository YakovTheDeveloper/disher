import Button from '@/components/ui/Button/Button'
import React from 'react'
import s from './Actions.module.css'
import { DetectChangesStore } from '@/store/common/DetectChangesStore'
import { observer } from 'mobx-react-lite';

type Props = {
    isDraft: true;
    id: string;
    detectChangesStore: null;
    remove: null
    save: () => void;
    resetToInit: () => void;
    isEmpty: boolean;
} | {
    isDraft: false;
    id: string;
    detectChangesStore: DetectChangesStore<any>;
    remove: (id: number) => void;
    save: (id: number) => void;
    resetToInit: () => void;
    isEmpty: boolean;
};

const Actions = ({ isDraft, id, detectChangesStore, remove, save, resetToInit, isEmpty }: Props) => {
    if (isDraft) {
        return (
            <>
                <Button className={s.mainButton} onClick={save} >Сохранить</Button>
                {!isEmpty &&
                    <Button onClick={resetToInit} variant="danger">
                        Очистить все продукты
                    </Button>}
            </>
        )
    }

    if (!isDraft) {
        return (
            <>
                <IfContentChange changeOccured={detectChangesStore.changeOccured}>
                    <Button className={s.mainButton} onClick={() => save(id)} >
                        Обновить
                    </Button>
                </IfContentChange>
                <IfContentChange changeOccured={detectChangesStore.changeOccured}>
                    <Button onClick={resetToInit} variant="danger">
                        Сбросить к первоначальному
                    </Button>
                </IfContentChange>
                <Button onClick={() => remove(id)} variant="danger">Удалить</Button>
            </>

        )
    }
}

type DraftProps = {
    save: () => void;
    resetToInit: () => void;
    isEmpty: boolean;
}

type UserProps = {
    isDraft: false;
    id: string;
    detectChangesStore: DetectChangesStore<any>;
    remove: (id: number) => void;
    save: (id: number) => void;
    resetToInit: () => void;
    isEmpty: boolean;
}

export const DraftActions = ({ save, resetToInit, isEmpty }: DraftProps) => {
    return (
        <>
            <Button className={s.mainButton} onClick={save} >Сохранить</Button>
            {!isEmpty &&
                <Button onClick={resetToInit} variant="danger">
                    Очистить все продукты
                </Button>}
        </>
    )
}

export const UserActions = ({ id, detectChangesStore, remove, save, resetToInit, isEmpty }: UserProps) => {
    return <>
        <>
            <IfContentChange changeOccured={detectChangesStore.changeOccured}>
                <Button className={s.mainButton} onClick={() => save(+id)} >
                    Обновить
                </Button>
            </IfContentChange>
            <IfContentChange changeOccured={detectChangesStore.changeOccured}>
                <Button onClick={resetToInit} variant="danger">
                    Сбросить к первоначальному
                </Button>
            </IfContentChange>
            <Button onClick={() => remove(+id)} variant="danger">Удалить</Button>
        </>
    </>
}



function IfContentChange({ changeOccured, children }) {
    if (!changeOccured) return null
    return children
}

export default observer(Actions)
