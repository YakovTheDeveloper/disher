import { ScheduleNavigator } from '@/features/schedule-navigator';
import { RouterLinks } from '@/app/router';
import { useNavigate } from 'react-router';

const ScheduleDateSelectionPage = () => {
  const navigate = useNavigate();

  const onDateChoose = (date: string) => {
    navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
  };

  return <ScheduleNavigator onSelect={onDateChoose} />;
};

export default ScheduleDateSelectionPage;
