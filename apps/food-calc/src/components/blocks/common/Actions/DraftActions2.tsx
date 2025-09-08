import { observer } from 'mobx-react-lite'
import React from 'react'
import s from './Actions.module.css'
import Button from '@/components/ui/Button/Button';
import Spinner from '@/components/ui/Spinner/Spinner';
import { LoadingStateStore } from '@/store/common/LoadingStateStore';
import { DraftStore } from '@/store/common/types';

type Props = {
    save: () => Promise<unknown>
    resetToInit: () => void
    isEmpty: boolean
    loadingState: LoadingStateStore
}

const DraftActions2 = ({ save, resetToInit, isEmpty, loadingState }: Props) => {

    const loading = loadingState.getLoading('save')

    return (
        <div className={s.container}>
            {loading && <span className={s.loading}>{loading && <Spinner />}</span>}
            <Button className={s.mainButton} onClick={save} disabled={loading}>
                Сохранить блюдо
            </Button>
            {!isEmpty && (
                <Button onClick={resetToInit} variant="danger" disabled={loading} className={s.deleteButton}>
                    Сбросить
                </Button>
            )}
        </div>
    );
}

export default observer(DraftActions2)