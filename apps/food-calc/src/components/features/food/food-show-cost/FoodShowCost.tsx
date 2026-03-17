import { observer } from 'mobx-react-lite';
import { Button } from '@/components/ui/atoms/Button';
import { domainStore } from '@/store/store';

const FoodShowCost = observer(() => {
  const { showCost, toggleShowCost } = domainStore.globalUiStore.options;

  return (
    <Button variant="ghost" onClick={toggleShowCost} style={{ opacity: showCost ? 1 : 0.4 }}>
      ₽
    </Button>
  );
});

export default FoodShowCost;
