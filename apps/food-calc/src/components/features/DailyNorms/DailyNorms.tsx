import { observer, useLocalObservable } from 'mobx-react-lite';
import styles from './DailyNorms.module.scss';
import { DailyNormEntity } from '@/store/models/dailyNorm/dailyNorm.types';
import {
  DailyNormEntityUI,
  DailyNormsViewModel,
} from '@/components/features/DailyNorms/viewModel/DailyNormsViewModel';
import { useCallback, useMemo } from 'react';
import { DailyNormsContent } from '@/components/features/DailyNorms/DailyNormsEdit';
import { ModalStoreUI } from '@/components/features/builders/food/shared/ModalStoreUI';
import { ModalRoot } from '@/components/features/builders/food/shared/ModalRoot';
import { Actions } from '@/components/features/builders/food/shared/ui/Actions';
import { Button as ActionButton } from '@/components/features/builders/food/shared/ui/Actions/button';
import { createDailyNorm, updateDailyNorm } from '@/api/dailyNorm/dailyNorm.api';
import { dailyNormModelStore } from '@/store/rootStore';
import { ListItem } from './ListItem';
import { DailyNormModelStore } from '@/store/models/dailyNorm/dailyNorm.model';

type Props = {
  children?: React.ReactNode;
  init: DailyNormEntity[];
};

const DailyNorms = ({ init }: Props) => {
  const store = useMemo(() => new DailyNormsViewModel(init), [init]);

  const modalStore = useMemo(() => new ModalStoreUI<'edit' | 'view'>(), []);

  const modelStore = useMemo(() => new DailyNormModelStore(), []);

  const options = useLocalObservable(() => ({
    showAdditionals: false,
    toggle() {
      this.showAdditionals = !this.showAdditionals;
    },
  }));

  // const onDelete = useCallback((id: string | number) => store.deleteChild(id), [store]);
  // const onRecover = useCallback((id: string | number) => store.recoverDeletedChild(id), [store]);

  const createAndOpenEdit = useCallback(() => {
    const id = store.addChild();
    store.setCurrentId(id);
    modalStore.set('edit');
  }, [modalStore, store]);

  const openForView = useCallback(
    (id: number | string) => {
      store.setCurrentId(id);
      modalStore.set('view');
    },
    [modalStore, store]
  );

  const onOpenEdit = (id: string | number) => {
    store.setCurrentId(id);
    modalStore.set('edit');
  };

  const onFinish = async (payload: DailyNormEntityUI | null) => {
    if (!payload) return;
    const localCreated = typeof payload.id === 'string';
    const method = localCreated ? createDailyNorm : updateDailyNorm;
    const result = await method(payload);
    if (!result.data) return;
    dailyNormModelStore.set(result.data.id, result.data);
    modalStore.close();
  };

  const onDelete = (id: number | string) => {
    // modelStore.remove();
  };

  const standardNorm = store.defaults[0];
  // const standardNorm2 = store.defaults[1]

  const showFinishButton = modalStore.current === 'edit';
  const showAdditionalOptionsButton = !modalStore.current;
  const showAddButton = !modalStore.current;

  return (
    <div className={styles.container}>
      <ListItem item={standardNorm} onTitle={() => openForView(standardNorm.id)}>
        {standardNorm.name}
      </ListItem>
      <ul>
        {store.items.map((item) => (
          <ListItem item={item} key={item.id} onTitle={onOpenEdit}>
            <p>{item.name}</p>
          </ListItem>
        ))}
      </ul>
      <ModalRoot modals={modalStore}>
        {{
          ['view']: <DailyNormsContent store={store} variant="view" />,
          ['edit']: <DailyNormsContent store={store} variant="modify" />,
        }}
      </ModalRoot>
      <Actions isShow={() => true}>
        {showFinishButton ? <ActionButton.Finish onFinish={onFinish} content={store} /> : <span />}
        {showAddButton && <ActionButton.Add onClick={createAndOpenEdit} />}
        {showAdditionalOptionsButton && <ActionButton.AdditionalOptions options={options} />}
      </Actions>
    </div>
  );
};

export default observer(DailyNorms);
