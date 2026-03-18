import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Instance } from 'mobx-state-tree';
import { DishItem } from '@/entities/dish';
import { SearchFormExpandable } from '@/components/features/shared/components/SearchFormExpandable';
import { SearchFood } from '@/components/features/builders/shared/components/SearchFood';
import { SearchFoodButton } from '@/components/features/builders/shared/components/SearchFood';
import { ProductQuantity } from '@/components/features/product/ProductQuantity';
import Button from '@/components/ui/atoms/Button/Button';
import Logo from '@/assets/icons/logo.svg';
import { ScreenLabel } from '@/components/features/builders/shared/atoms/ScreenLabel';
import s from './DishFoodInlineModal.module.scss';

type Props = {
  isOpen: boolean;
  dishItem: Instance<typeof DishItem>;
  onCommit: () => void;
  onClose: () => void;
  title?: string;
};

const DishFoodInlineModal = observer(
  ({ isOpen, dishItem, onCommit, onClose, title = 'Редактировать' }: Props) => {
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    const onFoodChange = (payload: { variant: 'dish' | 'product'; id: string }) => {
      if (payload.variant === 'dish') return;
      dishItem.updateFood(payload.id);
      setIsSearchExpanded(false);
    };

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
              <SearchFormExpandable
                isExpanded={isSearchExpanded}
                trigger={
                  <SearchFoodButton
                    onClick={() => setIsSearchExpanded(true)}
                    leftSlot={
                      <span className={s.logoSlot}>
                        <Logo />
                      </span>
                    }
                    placeholder="Добавить продукт или блюдо"
                    chosenFoodTitle={dishItem.content?.name}
                  />
                }
                content={
                  <SearchFood
                    mode="products-only"
                    onFinish={onFoodChange}
                    currentDishId={null}
                    currentProductId={dishItem.content?.foodId}
                  />
                }
              />

              {dishItem.content && (
                <ProductQuantity content={dishItem.content} onFinish={() => {}} />
              )}

              <div className={s.finishButton}>
                <Button variant="primary" onClick={onCommit}>
                  Готово
                </Button>
              </div>
            </div>
          </div>
        }
      />
    );
  }
);

export default DishFoodInlineModal;
