import { memo } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import s from './ConfirmDrawer.module.scss';

// Drawer-двойник ConfirmModal. `drawerStore.show(ConfirmDrawer, {...})`
// резолвится в `true` (подтвердить) / `false` (отмена); свайп-закрытие →
// `undefined`, поэтому всё, кроме `true`, трактуем как «не делать». Кнопки
// стилизованы здесь (а не Button-атомом), чтобы danger-тон был токен-driven —
// как у ConfirmModal.
export type ConfirmDrawerProps = BaseDrawerProps<boolean> & {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` красит кнопку подтверждения в красный (деструктивные действия). */
  tone?: 'default' | 'danger';
};

const ConfirmDrawer = ({
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  tone = 'default',
  onClose,
}: ConfirmDrawerProps) => (
  <DrawerLayout a11yLabel={title}>
    <div className={s.body}>
      <Heading role="headline" as="h2" className={s.title}>
        {title}
      </Heading>
      {message && (
        <Text role="caption" className={s.message}>
          {message}
        </Text>
      )}
      <div className={s.actions}>
        <button type="button" className={s.cancel} onClick={() => onClose(false)}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={tone === 'danger' ? s.confirmDanger : s.confirm}
          onClick={() => onClose(true)}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </DrawerLayout>
);

export default memo(ConfirmDrawer);
