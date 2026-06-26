import type { ReactNode } from 'react';
import clsx from 'clsx';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './EmptyState.module.scss';

type Props = {
  /** Главная строка пустого состояния (что здесь будет / почему пусто). */
  title: ReactNode;
  /** Необязательная вторая строка-пояснение (тише заголовка). */
  description?: ReactNode;
  /**
   * Необязательный слот действий (кнопка/пара кнопок). НЕ навязывается — у части
   * пустых зон это однострочное сообщение без CTA (см. план Slice 7 corner-case).
   */
  action?: ReactNode;
  className?: string;
};

// Общий контент-примитив пустого состояния. Владеет ТОЛЬКО контентом (заголовок +
// подпись + слот действий) и его внутренней раскладкой; ПОЗИЦИОНИРОВАНИЕ (где
// именно на экране, fixed-док и т.п.) — на вызывающем (через className / обёртку).
// Экспортит только компонент (Fast Refresh — fastrefresh-screenindicator).
export const EmptyState = ({ title, description, action, className }: Props) => (
  <div className={clsx(styles.root, className)}>
    <Text as="p" role="label" className={styles.title}>
      {title}
    </Text>
    {description && (
      <Text as="p" role="caption" className={styles.description}>
        {description}
      </Text>
    )}
    {action && <div className={styles.action}>{action}</div>}
  </div>
);

export default EmptyState;
