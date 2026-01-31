import { useEffect, useMemo } from 'react';

import { BuilderScheduleFood } from '@/components/features/builders/ScheduleBuilder/components/BuilderScheduleFood';
import { TotalNutrients } from '@/components/features/builders/shared/ContentInfo/TotalNutrients';
import { observer } from 'mobx-react-lite';
import { ISODate } from '@/types/common/common';
import { Instance } from 'mobx-state-tree';
import { DaySchedule } from '@/domain/schedule/schedule.model';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { domainStore } from '@/store/store';
import { Navigation } from '@/components/features/builders/ScheduleBuilder/ui/Navigation';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Buttons } from '@/components/features/builders/shared/ui/Actions/button';
import { MotionValue } from 'framer-motion';
import { ActionsHeader } from '@/components/features/builders/shared/components/ActionsHeader';
import { ScheduleFoodSelectionActions } from '@/components/features/builders/ScheduleBuilder/components/header-actions/ScheduleFoodSelectionActions';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { ModalType } from '@/store/GlobalUiStore/ModalStore/ModalContent';
import { DrawerTypesV2 } from '@/store/GlobalUiStore/DrawerStore/DrawerStore.v2.types';
import SwipeableV2 from '@/components/features/builders/shared/ui/layout/Swipeable/SwipeableV2';
import { BuilderScheduleEvents } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder';

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

  const onFoodAdd = () => {
    modalStore.openModal(ModalType.SCHEDULE_FOOD_ADD);
  };

  const onEventAdd = () => {
    modalStore.openModal(ModalType.SCHEDULE_EVENT_ADD);
  };

  console.log('SChedule buILder REnder');

  const pageNames = useMemo(() => ['nutrients', 'food', 'events'], []);

  const onPageChange = (page: number, total: number) => {
    domainStore.interactionsService.interactionsSelect.clearSelection();
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
                      domainStore.globalUiStore.drawerStore.open({
                        type: DrawerTypesV2.Confirmation.RemoveScheduleFood,
                      });
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
            bottom={<Buttons.Add onClick={onFoodAdd} />}
          >
            <BuilderScheduleFood schedule={schedule} />
          </Screen>,

          <Screen
            actions={
              <ActionsHeader
                left={
                  <button
                    onClick={() => {
                      domainStore.globalUiStore.drawerStore.open({
                        type: DrawerTypesV2.Confirmation.RemoveScheduleEvents,
                      });
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
            header={<Navigation></Navigation>}
            bottom={<Buttons.Add onClick={onEventAdd} />}
          >
            <BuilderScheduleEvents schedule={schedule} />
          </Screen>,
        ]}
      </SwipeableV2>
    </>
  );
};

export default observer(ScheduleBuilder);
