import { observer } from 'mobx-react-lite';
import styles from './DateChoose.module.scss';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { ScheduleSelection } from '@/components/features/schedule/ScheduleSelection';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
type Props = {
  children: React.ReactNode;
};

const DateChoose = ({ children }: Props) => {
  const navigate = useNavigate();

  return (
    <DrawerLayout
      className={styles.layoutContainer}
      label={<ScreenLabel variant="drawer">Перейти</ScreenLabel>}
    >
      <ScheduleSelection
        onSelect={(date: string) => {
          navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
        }}
      ></ScheduleSelection>
    </DrawerLayout>
  );
};

export default observer(DateChoose);
