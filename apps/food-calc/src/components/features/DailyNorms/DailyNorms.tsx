import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { ModalStoreUI } from '@/components/features/builders/food/shared/ModalStoreUI';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { DailyNormStoreInstance } from '@/store/DailyNormStore/DailyNormStore';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { DrawerStoreInstance } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import styles from './DailyNorms.module.scss';

type Props = {
  children?: React.ReactNode;
  store?: DailyNormStoreInstance;
  modalStore?: ModalStoreInstance;
  drawerStore?: DrawerStoreInstance;
};

const DailyNorms = ({
  store = domainStore.dailyNormStore,
  modalStore = domainStore.globalUiStore.modalStore,
  drawerStore = domainStore.globalUiStore.drawerStore,
}: Props) => {
  const navigate = useNavigate();

  const onOpenEdit = (id: string | number) => {};

  const onAdd = () => {
    const { id } = store.addNewLocal({
      name: 'Новая норма',
      description: '',
    });
    navigate(`${RouterLinks.DailyNorms}/${id}`);
  };

  return (
    <Screen
      actions={
        <ActionsHeader
          left={
            <button
              onClick={() => {
                modalStore.openConfirmationModal(ModalType.CONFIRMATION_REMOVE_DISHES);
              }}
            >
              удалить
            </button>
          }
        />
      }
      bottom={<Button.Add onClick={onAdd} />}
      title={<ScreenLabel variant="screenHeader">Нормы</ScreenLabel>}
    >
      <div className={styles.dailyNormsListWrapper}>
        <ItemsList offsetTop>
          {store.predefinedDataList.map((item) => (
            <CommonListItem key={item.id} id={item.id} sync={{ status: 'none' }} variant={2}>
              <p onClick={() => navigate(`${RouterLinks.DailyNorms}/${item.id}`)}>
                {item.name || 'без имени'}
              </p>
            </CommonListItem>
          ))}
          {store.userDataList.map((item) => (
            <CommonListItem key={item.id} id={item.id} sync={{ status: 'none' }} variant={2}>
              <p onClick={() => navigate(`${RouterLinks.DailyNorms}/${item.id}`)}>
                {item.name || 'без имени'}
              </p>
            </CommonListItem>
          ))}
        </ItemsList>
        <ItemsList offsetTop>
          {store.predefinedDataList.map((item) => (
            <button className={styles.dailyNormChooseButton}></button>
          ))}
          {store.userDataList.map((item) => (
            <button className={styles.dailyNormChooseButton}></button>
          ))}
        </ItemsList>
      </div>
    </Screen>
  );

  // return (
  //   <div className={styles.container}>
  //     <ListItem item={standardNorm} onTitle={() => openForView(standardNorm.id)}>
  //       {standardNorm.name}
  //     </ListItem>
  //     <ul>
  //       {store.data.map((item) => (
  //         <ListItem item={item} key={item.id} onTitle={onOpenEdit}>
  //           <p>{item.name}</p>
  //         </ListItem>
  //       ))}
  //     </ul>
  //     <ModalRoot modals={modalStore}>
  //       {{
  //         ['view']: <DailyNormsContent store={store} variant="view" />,
  //         ['edit']: <DailyNormsContent store={store} variant="modify" />,
  //       }}
  //     </ModalRoot>
  //     <Actions isShow={() => true}>
  //       {showFinishButton ? <ActionButton.Finish onFinish={onFinish} content={store} /> : <span />}
  //       {showAddButton && <ActionButton.Add onClick={createAndOpenEdit} />}
  //       {showAdditionalOptionsButton && <ActionButton.AdditionalOptions options={options} />}
  //     </Actions>
  //   </div>
  // );
};

export default observer(DailyNorms);
