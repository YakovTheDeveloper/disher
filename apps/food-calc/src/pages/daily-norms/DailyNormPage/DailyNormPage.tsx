import { observer } from 'mobx-react-lite';
import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Spacer } from '@/components/ui/atoms/Spacer';
import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { domainStore } from '@/store/store';
import { useParams } from 'react-router';
import DailyNormsEdit from '@/components/features/lists/ListDailyNorms/DailyNormsEdit/DailyNormsContent';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ChangeName } from '@/components/features/shared/change-name';
import { Ornament } from '@/components/ui/Ornament';
type Props = {};

const DailyNormPage = ({}: Props) => {
  const { id } = useParams<'id'>();
  const dailyNorm = id ? domainStore.dailyNormStore.getEntity(id) : undefined;

  const createdByUser = dailyNorm?.createByUser;
  const dailyNormsView = createdByUser ? 'modify' : 'view';

  if (!dailyNorm) {
    console.error('Daily norm not found for id:', id);
    return null;
  }

  return (
    <Screen
      title={<ScreenLabel variant="screenHeader">Норма</ScreenLabel>}
    >
      <ChangeName entity={dailyNorm} canRename={createdByUser} />
      <Spacer variant="screen-header-offset" />
      <Ornament text="описание дневной нормы"></Ornament>
      <label>
        <Textarea
          disabled={!createdByUser}
          value={dailyNorm?.description || ''}
          onChange={(val) => dailyNorm?.changeDescription(val || '')}
        />
      </label>
      <Ornament text="нутриенты"></Ornament>
      <DailyNormsEdit dailyNorm={dailyNorm} variant={dailyNormsView}></DailyNormsEdit>
    </Screen>
  );
};

export default observer(DailyNormPage);
