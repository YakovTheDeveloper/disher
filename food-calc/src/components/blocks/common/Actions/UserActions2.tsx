import { observer } from 'mobx-react-lite'
import React from 'react'
import s from './Actions.module.css'
import Button from '@/components/ui/Button/Button';
import Spinner from '@/components/ui/Spinner/Spinner';
import { LoadingStateStore } from '@/store/common/LoadingStateStore';
import { DraftStore, UserDataStore } from '@/store/common/types';
import { DetectChangesStore } from '@/store/common/DetectChangesStore';
import RemoveTooltip from '@/components/blocks/common/RemoveTooltip/RemoveTooltip';
import { Tooltip } from '@/components/ui/Tooltip/Tooltip';


type Props = {
    update: (id: number) => Promise<void>
    remove: (id: number) => Promise<void>
    resetToInit: () => void
    loadingState: LoadingStateStore
    store: UserDataStore<any>
}

const UserActions2 = ({
    remove,
    update,
    resetToInit,
    store,
    loadingState,
}: Props) => {
    const { detectChangesStore = null, id } = store
    const loading = loadingState.getLoading('delete', id) || loadingState.getLoading('update', id)

    return (
        <div className={s.container}>
            <Button
                className={s.mainButton}
                onClick={() => update(+id)}
                disabled={loading}
            >
                Обновить блюдо
            </Button>
            <span className={s.loading}>{loading && <Spinner />}</span>
            {/* {detectChangesStore?.changeOccured &&
                <Button onClick={resetToInit} variant="danger" disabled={loading}>
                    Отменить изменения
                </Button>
            } */}

            <Tooltip placement='left-start'>
                <RemoveTooltip
                    onConfirm={() => remove(+id)}
                >
                    <Button variant="danger" disabled={loading} className={s.deleteButton}>
                        Удалить
                    </Button>
                </RemoveTooltip>
            </Tooltip>

        </div>
    );
}

export default observer(UserActions2)