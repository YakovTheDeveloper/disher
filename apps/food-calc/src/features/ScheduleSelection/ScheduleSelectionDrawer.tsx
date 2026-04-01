import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ScheduleSelection } from './ScheduleSelection';
import { useDesignVariants } from '@/shared/lib/useDesignVariants';
import { CalendarVariantWrapper, CALENDAR_VARIANTS } from './CalendarDesignVariants';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

export const ScheduleSelectionDrawer = ({ onClose, selectedDate }: Props) => {
  const { index, total } = useDesignVariants(CALENDAR_VARIANTS.length, 8000);

  return (
    <DrawerLayout>
      <div style={{ height: '90dvh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <CalendarVariantWrapper index={index} total={total}>
            <ScheduleSelection selectedDate={selectedDate} onSelect={(date) => onClose(date)} />
          </CalendarVariantWrapper>
        </div>
      </div>
    </DrawerLayout>
  );
};
