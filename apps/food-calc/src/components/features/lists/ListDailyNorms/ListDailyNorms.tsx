import { observer } from 'mobx-react-lite';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { DailyNormStoreInstance } from '@/store/DailyNormStore/DailyNormStore';
import { domainStore } from '@/store/store';
import { RouterLinks } from '@/router';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { DrawerStoreInstance } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import styles from './ListDailyNorms.module.scss';
import clsx from 'clsx';
import { Spacer } from '@/components/ui/atoms/Spacer';
import { Button } from '@/components/ui/atoms/Button';
import { ScalableHeaderNameInput } from '@/components/features/shared/components/ScalableHeaderNameInput';
import { useListStateActions } from '@/components/features/shared/hooks/useListStateActions';
import { DailyNormsFactory } from '@/domain/dailyNorm/factory';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ActionsHeader } from '@/components/features/builders/shared/components/ActionsHeader';
import { SelectableItem } from '@/components/ui/SelectableItem';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';

type Props = {
  children?: React.ReactNode;
  store?: DailyNormStoreInstance;
  drawerStore?: DrawerStoreInstance;
  selectableItems?: boolean;
  addControls?: boolean;
};

const ListDailyNorms = ({
  store = domainStore.dailyNormStore,
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
        createByUser: true,
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
                domainStore.globalUiStore.drawerStore.open({
                  type: DrawerTypesV2.Confirmation.RemoveDailyNorms,
                });
              }}
            >
              удалить
            </button>
          }
        />
      }
      bottom={<Buttons.Add onClick={onAdd} />}
      title={<ScreenLabel variant="screenHeader">Нормы</ScreenLabel>}
      backgroundColor="gray"
    >
      <Spacer variant="screen-header-offset" />
      <Button variant="filter">Фильтр</Button>
      <ItemsList>
        {filter.filteredList.map((item) => (
          <SelectableItem
            key={item.id}
            id={item.id}
            isSelected={store.selectedNormId === item.id}
            onSelect={(id) => store.setSelectedId(id)}
          >
            <CommonListItem id={item.id} variant={2} className={styles.listItem}>
              <p onClick={() => navigate(`${RouterLinks.DailyNorms}/${item.id}`)}>
                {item.name || 'без имени'}
              </p>
            </CommonListItem>
          </SelectableItem>
        ))}
      </ItemsList>
    </Screen>
  );
};

export default observer(ListDailyNorms);
