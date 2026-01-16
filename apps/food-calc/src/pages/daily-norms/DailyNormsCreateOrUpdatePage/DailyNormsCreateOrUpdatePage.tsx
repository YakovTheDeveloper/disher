import { observer } from 'mobx-react-lite';
import { Screen } from '@/components/features/builders/food/shared/ui/layout/Screen';
import { Spacer } from '@/components/ui/atoms/Spacer';
import Textarea from '@/components/ui/Textarea/Textarea';
import { domainStore } from '@/store/store';
import { useParams } from 'react-router';
import DailyNormsEdit from '@/components/features/DailyNorms/DailyNormsEdit/DailyNormsEdit';
import { ScreenLabel } from '@/components/features/builders/food/shared/atoms/ScreenLabel';
import { HeaderInputName } from '@/components/features/builders/food/shared/components/UserProductHeader';
type Props = {};

const DailyNormsCreateOrUpdatePage = ({}: Props) => {
  const { id } = useParams<'id'>();
  const userDailyNorm = id ? domainStore.dailyNormStore.getUserDailtNormById(id) : undefined;
  if (!userDailyNorm) return;

  return (
    <Screen
      title={<ScreenLabel variant="screenHeader">Норма</ScreenLabel>}
      header={(scrollYProgress) => (
        <HeaderInputName scrollYProgress={scrollYProgress} entity={userDailyNorm} />
      )}
    >
      <Spacer variant="screen-header-offset" />
      <label>
        <Textarea
          value={userDailyNorm?.description || ''}
          onChange={(val) => userDailyNorm?.changeDescription(val || '')}
        />
      </label>
      <DailyNormsEdit dailyNorm={userDailyNorm} variant="modify"></DailyNormsEdit>
    </Screen>
  );
};

export default observer(DailyNormsCreateOrUpdatePage);
