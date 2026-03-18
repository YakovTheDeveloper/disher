import { Screen } from '@/components/features/builders/shared/ui/layout/Screen';
import { Spacer } from '@/components/ui/atoms/Spacer';
import Textarea from '@/components/ui/atoms/Textarea/Textarea';
import { useParams } from 'react-router';
import { useDailyNorm, updateDailyNorm } from '@/entities/daily-norm';
import DailyNormsEdit from '@/components/features/lists/ListDailyNorms/DailyNormsEdit/DailyNormsContent';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import { ChangeName } from '@/components/features/shared/change-name';
import { Ornament } from '@/components/ui/Ornament';

type Props = {};

const DailyNormPage = ({}: Props) => {
  const { id } = useParams<'id'>();
  const { result: dailyNorm } = useDailyNorm(id);

  // TODO: migrate to Triplit — createByUser not available on Triplit entity
  const createdByUser = true;
  const dailyNormsView = createdByUser ? 'modify' : 'view';

  if (!dailyNorm) {
    console.error('Daily norm not found for id:', id);
    return null;
  }

  const entityForChangeName = {
    name: dailyNorm.name,
    changeName: (name: string) => updateDailyNorm(dailyNorm.id, { name }),
  };

  return (
    <Screen
      offsetTop
      title={<ScreenLabel variant="screenHeader">Норма</ScreenLabel>}
    >
      <ChangeName entity={entityForChangeName} canRename={createdByUser} />
      <Spacer variant="screen-header-offset" />
      <Ornament text="описание дневной нормы"></Ornament>
      <label>
        <Textarea
          disabled={!createdByUser}
          value={dailyNorm?.description || ''}
          onChange={(val) => updateDailyNorm(dailyNorm.id, { description: val || '' })}
        />
      </label>
      <Ornament text="нутриенты"></Ornament>
      <DailyNormsEdit dailyNorm={dailyNorm} variant={dailyNormsView}></DailyNormsEdit>
    </Screen>
  );
};

export default DailyNormPage;
