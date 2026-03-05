import { observer } from 'mobx-react-lite';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { Instance } from 'mobx-state-tree';
import { Dish } from '@/domain/dish/Dish.model';
import { ItemsList } from '@/components/ui/atoms/ItemsList';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { TotalNutrients } from '@/components/features/builders/TotalNutrients/TotalNutrients';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import { domainStore } from '@/store/store';
import { ActionsHeader } from '@/components/features/builders/shared/components/ActionsHeader';
import { DishFoodSelectionActions } from '@/components/features/builders/DishBuilder/components/header-actions/DishFoodSelectionActions';
import { getDishFoodDraftUrl, getDishFoodUrl, RouterLinks, RouterUrls } from '@/router';
import { MotionValue } from 'framer-motion';
import { Scalable } from '@/components/ui/Scalable';
import { useNavigate } from 'react-router';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { HeaderInputName } from '@/components/features/builders/shared/components/HeaderInputName';
import { useOverlay } from '@/store/GlobalUiStore/OverlayStore';
import { clearSessionStorage } from '@/infrastructure/storage/sessionStorage';
import { CommonListItem } from '@/components/features/builders/shared/ui/CommonListItem';
import { FoodName } from '@/components/features/builders/shared/ui/FoodName';
import { Quantity } from '@/components/features/builders/shared/ui/Quantity';
import { NumberInput } from '@/components/ui/atoms/input/NumberInput';
import styles from './DishBuilder.module.scss';
import AddButton from '@/components/ui/atoms/Button/AddButton/AddButton';
import EditableText from '@/components/ui/atoms/EditableText/EditableText';
import TextBehind from '@/components/ui/TextBehind/TextBehind';

type Props = {
  init: Instance<typeof Dish>;
};

const DishBuilder = ({ init }: Props) => {
  const dishes = init;
  const navigate = useNavigate();

  const onAdd = () => {
    navigate(getDishFoodDraftUrl(dishes.id));
  };

  const onEdit = (childId: string) => {
    navigate(getDishFoodUrl(dishes.id, childId));
  };

  return (
    <SwipeableV2>
      <Screen key={1} title={<ScreenLabel variant="screenHeader">Нутриенты</ScreenLabel>}>
        <TotalNutrients store={dishes} countable={dishes} />
      </Screen>

      <Screen
        offsetTop
        actions={
          <ActionsHeader
            left={
              <button
                onClick={() => {
                  domainStore.globalUiStore.drawerStore.open({
                    type: DrawerTypesV2.Confirmation.RemoveDishItems,
                  });
                }}
              >
                удалить
              </button>
            }
          >
            <DishFoodSelectionActions />
          </ActionsHeader>
        }
        key={2}
        title={
          <ScreenLabel
            variant="screenHeader"
            onClick={() => {
              navigate(RouterLinks.ScheduleBuilder);
            }}
          >
            {init.name}
          </ScreenLabel>
        }
        header={
          <TextBehind text="Блюдо">
            <EditableText
              value={init?.name || ''}
              onChange={(val) => init?.changeName(val)}
              className={styles.textInput}
            />
          </TextBehind>
        }
        bottomRight={<AddButton onClick={onAdd} />}
      >
        <ItemsList offsetTop>
          {dishes.items.map((item) => {
            const content = item.content;
            const id = item.id;

            return (
              <CommonListItem
                key={id}
                id={id}
                className={styles.group}
                innerClassName={styles.dishFoodListItem}
              >
                <FoodName onClick={() => onEdit(id)} content={content} />
                <Quantity id={id} hide={false} unit="г" content={content} />
              </CommonListItem>
            );
          })}
        </ItemsList>
      </Screen>
    </SwipeableV2>
  );
};

export default observer(DishBuilder);
