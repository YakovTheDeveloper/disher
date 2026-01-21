import { observer } from 'mobx-react-lite';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { DailyNormStoreInstance } from '@/store/DailyNormStore/DailyNormStore';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { DrawerStoreInstance } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import styles from './DailyNorms.module.scss';
import clsx from 'clsx';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { FilterButton } from '@/components/features/builders/food/shared/atoms/button/FilterButton';
import { ScalableHeaderNameInput } from '@/components/features/lists/shared/ScalableHeaderNameInput';
import { useListStateActions } from '@/components/features/lists/shared/hooks/useListStateActions';
import { DailyNormsFactory } from '@/domain/dailyNorm/factory';

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
  // const navigate = useNavigate();

  const { onAdd, navigate, filter } = useListStateActions({
    store,
    basePath: RouterLinks.DailyNorms,
    createDraft: () =>
      DailyNormsFactory.createNewLocal({
        name: 'Новая норма',
        description: '',
      }),
    filterKeys: ['name', 'description'],
  });

  return (
    <Screen
      header={<ScalableHeaderNameInput state={filter} />}
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
      backgroundColor="gray"
    >
      <Spacer variant="screen-header-offset" />
      <FilterButton />
      <ItemsList>
        {filter.filteredList.map((item) => (
          <div
            key={item.id}
            className={clsx([styles.item, store.selectedNormId === item.id && styles.selected])}
          >
            <CommonListItem id={item.id} variant={2} innerClassName={clsx([styles.innerListItem])}>
              <p onClick={() => navigate(`${RouterLinks.DailyNorms}/${item.id}`)}>
                {item.name || 'без имени'}
              </p>
            </CommonListItem>
            <button
              onClick={() => store.setSelectedId(item.id)}
              className={clsx([styles.selectButton])}
            ></button>
          </div>
        ))}
      </ItemsList>
    </Screen>
  );
};

export default observer(DailyNorms);
