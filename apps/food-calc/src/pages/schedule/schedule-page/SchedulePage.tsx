import { ScheduleSelection } from '@/components/blocks/schedule/ScheduleSelection';
import { useNavigate } from 'react-router';

const SchedulePage = () => {
  const navigate = useNavigate();

  const onDateChoose = (date: string) => {
    navigate(`builder/${date}`);
  };

  return (
    <>
      <ScheduleSelection onDate={onDateChoose} />
    </>
  );
};

export default SchedulePage;
