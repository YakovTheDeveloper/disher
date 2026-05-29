import { ScheduleNavigator } from '@/features/schedule-navigator';
import { RouterLinks } from '@/app/router';
import { useNavigate } from 'react-router';
import { useSurface } from '@/shared/lib/surface';

const ScheduleDateSelectionPage = () => {
  useSurface('warm');
  const navigate = useNavigate();

  const onDateChoose = (date: string) => {
    navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
  };

  return <ScheduleNavigator onSelect={onDateChoose} />;
};

export default ScheduleDateSelectionPage;
