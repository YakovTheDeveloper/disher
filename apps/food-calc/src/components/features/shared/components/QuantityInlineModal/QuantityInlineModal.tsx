import { observer } from 'mobx-react-lite';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';
import { FoodContentInstance } from '@/domain/shared/foodContent/foodContent';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import Button from '@/components/ui/atoms/Button/Button';
import s from './QuantityInlineModal.module.scss';

type Props = {
  isOpen: boolean;
  content: FoodContentInstance | null;
  onClose: () => void;
  onCommit: () => void;
  title?: string;
  commitLabel?: string;
};

const QuantityInlineModal = observer(
  ({ isOpen, content, onClose, onCommit, title = 'Количество', commitLabel = 'Готово' }: Props) => {
    return (
      <SearchFormExpandable
        position="absolute"
        isExpanded={isOpen}
        content={
          <div className={s.wrapper}>
            <header className={s.header}>
              <button className={s.backButton} onClick={onClose}>
                ←
              </button>
              <ScreenLabel>{title}</ScreenLabel>
            </header>

            <div className={s.spacer} />

            <div className={s.content}>
              {content && <ProductQuantity content={content} onFinish={() => {}} />}

              <div className={s.finishButton}>
                <Button variant="primary" onClick={onCommit}>
                  {commitLabel}
                </Button>
              </div>
            </div>
          </div>
        }
      />
    );
  }
);

export default QuantityInlineModal;
