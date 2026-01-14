import { observer } from 'mobx-react-lite';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Dishes.module.scss';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { CommonListItem } from '@/components/features/builders/food/shared/ui/CommonListItem';
import { domainStore } from '@/store/store';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { RouterLinks } from '@/router';
type Props = {
  modalStore?: ModalStoreInstance;
};

const Dishes = ({ modalStore = domainStore.globalUiStore.modalStore }: Props) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('from_date');

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
      title={
        <ScreenLabel
          variant="screenHeader"
          onClick={() => navigate(`${RouterLinks.ScheduleBuilder}/${date}`)}
        >
          Блюда
        </ScreenLabel>
      }
    >
      <ItemsList offsetTop>
        {domainStore.dishStore.list.map((dishItem) => (
          <CommonListItem key={dishItem.id} id={dishItem.id} sync={{ status: 'none' }}>
            <p onClick={() => navigate(`${RouterLinks.DishBuilder}/${dishItem.id}`)}>
              {dishItem.name || 'без имени'}
            </p>
          </CommonListItem>
        ))}
      </ItemsList>
    </Screen>
  );
};

export default observer(Dishes);
