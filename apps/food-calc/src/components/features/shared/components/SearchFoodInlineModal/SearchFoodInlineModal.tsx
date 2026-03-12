import { observer } from 'mobx-react-lite';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import type { SearchMode } from '@/components/features/builders/shared/components/SearchFood/SearchFood';

type Props = {
  isOpen: boolean;
  onSelect: (payload: { variant: 'product' | 'dish'; id: string }) => void;
  mode?: SearchMode;
  currentProductId?: string | null;
  currentDishId?: string | null;
};

const SearchFoodInlineModal = observer(
  ({ isOpen, onSelect, mode = 'products-only', currentProductId, currentDishId }: Props) => {
    return (
      <SearchFormExpandable
        position="absolute"
        isExpanded={isOpen}
        content={
          <SearchFood
            mode={mode}
            onFinish={onSelect}
            currentProductId={currentProductId}
            currentDishId={currentDishId}
          />
        }
      />
    );
  }
);

export default SearchFoodInlineModal;
