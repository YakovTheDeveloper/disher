import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import { Text } from '@/shared/ui/atoms/Typography';
import type { ReactNode } from 'react';
import s from './SectionInfoDrawer.module.scss';

// Лёгкий боковой drawer-объяснялка раздела /analyses — короткий текст «что это»
// за ⓘ-кнопкой листа (Инсайты / Гипотезы). Контент прокидывает вызывающий слайд
// (переиспользует копирайт EmptyState), поэтому drawer один на оба экрана.
type Props = BaseDrawerProps<void> & {
  title: string;
  description: ReactNode;
};

export function SectionInfoDrawer({ title, description }: Props) {
  return (
    <DrawerLayout title={title}>
      <Text role="body" className={s.description}>
        {description}
      </Text>
    </DrawerLayout>
  );
}

export default SectionInfoDrawer;
