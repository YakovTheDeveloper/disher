import { observer } from 'mobx-react-lite';
import { useAppRoutes } from '@/app/routing/useAppRoutes';
import { Button } from '@/components/ui/atoms/Button';
type Props = {
  children: React.ReactNode;
  date: string;
  className?: string;
};

const OpenScheduleFoodAnalytics = ({ date, className }: Props) => {
  const { toScheduleAnalytics } = useAppRoutes();

  return (
    <Button className={className} variant="ghost" onClick={() => toScheduleAnalytics(date)}>
      Анализ расписания
    </Button>
  );
};

export default observer(OpenScheduleFoodAnalytics);
