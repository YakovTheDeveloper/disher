import { observer } from 'mobx-react-lite';
import styles from './DateChoose.module.scss';
import { DrawerLayout } from '@/components/features/builders/food/shared/components/DrawerLayout';
import { ScheduleSelection } from '@/components/features/schedule/ScheduleSelection';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
type Props = {
  children?: React.ReactNode;
  close: () => void;
};

const DateChoose = ({ children, close }: Props) => {
  const navigate = useNavigate();

  return (
    <DrawerLayout
      className={styles.layoutContainer}
      label={<ScreenLabel variant="drawer">Перейти</ScreenLabel>}
    >
      <ScheduleSelection
        onSelect={(date: string) => {
          close();
          navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
        }}
      ></ScheduleSelection>
    </DrawerLayout>
  );
};

export default observer(DateChoose);
