import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { Button } from '@/shared/ui/atoms/Button';
import s from './SuggestNutrientsConfirmDrawer.module.scss';

// Confirm-before-overwrite gate for «Предложить нутриенты». Resolves the
// drawer promise with `true` (proceed) / `false` (cancel). A swipe-dismiss
// resolves `undefined`, which the caller treats as cancel.
type Props = BaseDrawerProps<boolean>;

export function SuggestNutrientsConfirmDrawer({ onClose }: Props) {
  return (
    <DrawerLayout a11yLabel="Предложить нутриенты">
      <div className={s.body}>
        <Heading size="drawer" as="h2" className={s.title}>
          Все прошлые нутриенты сотрутся. Продолжить?
        </Heading>
        <div className={s.actions}>
          <Button variant="ghost" onClick={() => onClose(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={() => onClose(true)}>
            Продолжить
          </Button>
        </div>
      </div>
    </DrawerLayout>
  );
}

export default SuggestNutrientsConfirmDrawer;
