import { DraftActions, UserActions } from '@/components/blocks/common/Actions/Actions'
import { DayStore, UserDayStore } from '@/store/dayStore/rootDayStore'
import React from 'react'

type Props = {
  store: DayStore
}
const DayActions = ({ store }: Props) => {
  if (store instanceof UserDayStore) {
    const { categoriesEmpty, remove, onSave, detectChangesStore, resetToInit, id } = store
    return (
      <UserActions
        detectChangesStore={detectChangesStore}
        id={id.toString()}
        isEmpty={categoriesEmpty}
        remove={remove}
        resetToInit={resetToInit}
        save={onSave}
      />

    )
  }

  const { resetToInit, categoriesEmpty, onSave } = store
  return (
    <DraftActions
      resetToInit={resetToInit}
      isEmpty={categoriesEmpty}
      save={onSave}
    />

  )

}



export default DayActions