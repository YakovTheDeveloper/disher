import { memo } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ActionList } from '@/shared/ui/ActionList';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import LupaIcon from '@/shared/assets/icons/lupa.svg?react';
import styles from './ProductHubDrawer.module.scss';

type Props = BaseDrawerProps<void> & {
  /** AI-подбор состава по названию (тот же флоу, что empty-state ProductPage). */
  onSuggest: () => void;
  /** Гейт: подбор идёт / пустое имя. */
  suggestDisabled?: boolean;
};

// «О!»-хаб страницы продукта — зеркало DishHubDrawer, но у продукта аналога
// анализа блюда нет: единственный ряд «Найти нутриенты» (AI-подбор состава).
// Показывается ТОЛЬКО у своих продуктов (ProductPage гейтит кнопку «О!»);
// каталожному продукту хаб скрыт целиком. Свежий mount на каждое открытие.
const ProductHubDrawer = ({ onSuggest, suggestDisabled, onClose }: Props) => {
  function suggest() {
    onClose();
    onSuggest();
  }

  return (
    <DrawerLayout title="Продукт">
      {/* Ряд-действие SettingRow в одной секции ActionList (1:1 с DishHubDrawer).
          Секция без заголовка — он дублировал бы «Продукт» из шапки. */}
      <ActionList>
        <ActionList.Section as="h3">
          <div className={styles.rows}>
            <SettingRow
              icon={<LupaIcon width={18} height={18} />}
              label="Найти нутриенты"
              sub="Подобрать состав по названию продукта"
              trailing={<ChevronGlyph />}
              onClick={suggest}
              disabled={suggestDisabled}
            />
          </div>
        </ActionList.Section>
      </ActionList>
    </DrawerLayout>
  );
};

export default memo(ProductHubDrawer);
