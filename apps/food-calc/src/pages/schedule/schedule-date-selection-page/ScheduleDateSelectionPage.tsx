import { ScheduleSelection } from '@/features/ScheduleSelection';
import { RouterLinks } from '@/router';
import { useNavigate } from 'react-router';

const ScheduleDateSelectionPage = () => {
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

export default ScheduleDateSelectionPage;
