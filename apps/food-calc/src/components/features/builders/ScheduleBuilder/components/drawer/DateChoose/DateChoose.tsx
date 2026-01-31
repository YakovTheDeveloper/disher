import { observer } from 'mobx-react-lite';
import { ScheduleSelection } from '@/components/features/ScheduleSelection';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import styles from './DateChoose.module.scss';
type Props = {
  onClose: VoidFunction;
};

const DateChoose = ({ onClose }: Props) => {
  const navigate = useNavigate();

  return (
    <ScheduleSelection
      className={styles.container}
      onSelect={(date: string) => {
        onClose();
        navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
      }}
    ></ScheduleSelection>
  );
};

export default observer(DateChoose);
