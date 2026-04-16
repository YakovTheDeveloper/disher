import { SchedulePeriods } from '@/features/ScheduleSelection/SchedulePeriods';
import { modalStore, type BaseModalProps } from '@/shared/ui';

type Props = BaseModalProps & {
  date: string;
};

const SchedulePeriodsModalContent = ({ date, onClose }: Props) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 4001,
        background: 'linear-gradient(135deg, rgb(224, 229, 246) 0%, rgb(235, 242, 250) 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SchedulePeriods date={date} onClose={() => onClose()} />
    </div>
  );
};

export function openSchedulePeriodsModal(date: string) {
  return modalStore.show(SchedulePeriodsModalContent, { date });
}
