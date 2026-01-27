import { useEffect, useMemo } from 'react';

import { List } from '@/components/features/builders/food/ScheduleBuilder/ui/List';
import { TotalNutrients } from '@/components/features/builders/food/shared/ContentInfo/TotalNutrients';
import { BuilderUIStore } from '@/components/features/builders/food/shared/BuilderUIStore';
import { observer } from 'mobx-react-lite';
import { EventsBuilder } from '@/components/features/builders/food/ScheduleBuilder/EventsBuilder';

import { ISODate } from '@/types/common/common';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { domainStore } from '@/store/store';
import { Navigation } from '@/components/features/builders/food/ScheduleBuilder/ui/Navigation';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { Button } from '@/components/features/builders/food/shared/ui/Actions/button';
import { MotionValue } from 'framer-motion';
import { ActionsHeader } from '@/components/features/builders/food/shared/components/ActionsHeader';
import { ScheduleDrawers } from '@/store/GlobalUiStore/DrawerStore/DrawerStore';
import { ScheduleFoodSelectionActions } from '@/components/features/builders/food/ScheduleBuilder/components/header-actions/ScheduleFoodSelectionActions';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import SwipeableV2 from '@/components/features/builders/food/shared/ui/layout/Swipeable/SwipeableV2';

type Props = {
  // onFinish: (payload: Instance<typeof DaySchedule>) => Promise<void>;
  schedule: Instance<typeof DaySchedule>;
  date: ISODate;
  modalStore?: ModalStoreInstance;
};

const ScheduleBuilder = ({
  schedule,
  date,
  modalStore = domainStore.globalUiStore.modalStore,
}: Props) => {
  const navigate = useNavigate();

  const modals = domainStore.globalUiStore.drawerStore;

  const onFoodAdd = () => {
    modalStore.openModal(ModalType.SCHEDULE_FOOD_ADD);
  };

  const onEventAdd = () => {
    modalStore.openModal(ModalType.SCHEDULE_EVENT_ADD);
  };

  console.log('SChedule buILder REnder');

  const pageNames = useMemo(() => ['nutrients', 'food', 'events'], []);

  const onPageChange = (page: number, total: number) => {
    domainStore.globalUiStore.clearSelection();
    if (page === 2) {
      document.body.style.backgroundColor = '#e6e6e6';
    } else {
      document.body.style.backgroundColor = '';
    }
  };

  return (
    <>
      <SwipeableV2 pageNames={pageNames} defaultIndex={1} onIndexChange={onPageChange}>
        {[
          <Screen key={1} title={<ScreenLabel variant="screenHeader">Нутриенты</ScreenLabel>}>
            <TotalNutrients store={schedule} countable={schedule} />
          </Screen>,

          <Screen
            actions={
              <ActionsHeader
                left={
                  <button
                    onClick={() => {
                      modalStore.openConfirmationModal(ModalType.CONFIRMATION_REMOVE_SCHEDULE_FOOD);
                    }}
                  >
                    удалить
                  </button>
                }
              >
                <ScheduleFoodSelectionActions />
              </ActionsHeader>
            }
            key={2}
            title={
              <ScreenLabel
                variant="screenHeader"
                onClick={() => {
                  navigate(RouterLinks.Dishes + `?from_date=${date}`);
                }}
              >
                Еда
              </ScreenLabel>
            }
            header={<Navigation></Navigation>}
            bottom={<Button.Add onClick={onFoodAdd} />}
          >
            <List schedule={schedule} />
          </Screen>,

          <Screen
            actions={
              <ActionsHeader
                left={
                  <button
                    onClick={() => {
                      modalStore.openConfirmationModal(
                        ModalType.CONFIRMATION_REMOVE_SCHEDULE_EVENTS
                      );
                    }}
                  >
                    удалить
                  </button>
                }
              >
                экшены событий
                {/* <ScheduleFoodSelectionActions /> */}
              </ActionsHeader>
            }
            key={3}
            title={<ScreenLabel variant="screenHeader">События</ScreenLabel>}
            header={(scrollYProgress: MotionValue<number>) => (
              <Navigation scrollYProgress={scrollYProgress}></Navigation>
            )}
            bottom={<Button.Add onClick={onEventAdd} />}
          >
            <EventsBuilder schedule={schedule} />
          </Screen>,
        ]}
      </SwipeableV2>
    </>
  );
};

export default observer(ScheduleBuilder);
