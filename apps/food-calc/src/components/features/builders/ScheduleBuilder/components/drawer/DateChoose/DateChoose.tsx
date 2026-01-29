import { observer } from 'mobx-react-lite';
import styles from './DateChoose.module.scss';
import { DrawerLayout } from '@/components/features/builders/shared/components/DrawerLayout';
import { ScheduleSelection } from '@/components/features/ScheduleSelection';
import { useNavigate } from 'react-router';
import { RouterLinks } from '@/router';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { DrawerProps } from '@/types/common/drawer.v2';

type Props = DrawerProps;

const DateChoose = ({ onClose }: Props) => {
  const navigate = useNavigate();

  return (
    <DrawerLayout
      className={styles.layoutContainer}
      label={<ScreenLabel variant="drawer">Перейти</ScreenLabel>}
    >
      <ScheduleSelection
        onSelect={(date: string) => {
          onClose();
          navigate(`${RouterLinks.ScheduleBuilder}/${date}`);
        }}
      ></ScheduleSelection>
    </DrawerLayout>
  );
};

export default observer(DateChoose);
