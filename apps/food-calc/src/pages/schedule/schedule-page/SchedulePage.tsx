import { ScheduleSelection } from '@/components/features/schedule/ScheduleSelection';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';

const SchedulePage = () => {
  const navigate = useNavigate();

  const onDateChoose = (date: string) => {
    navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
  };

  return (
    <>
      <ScheduleSelection onSelect={onDateChoose} showFastButtons />
    </>
  );
};

export default SchedulePage;
