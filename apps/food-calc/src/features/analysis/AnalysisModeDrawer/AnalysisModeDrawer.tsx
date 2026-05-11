import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import type { AnalysisMode } from '../api';
import styles from './AnalysisModeDrawer.module.scss';

type Props = BaseDrawerProps<AnalysisMode>;

const FoodIcon = () => (
  <svg
    className={styles.optionIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 5v5" />
    <path d="M12 5v5" />
    <path d="M15 5v5" />
    <path d="M9 10c0 2 1.3 3 3 3s3-1 3-3" />
    <path d="M12 13v6" />
  </svg>
);

const FoodAndEventsIcon = () => (
  <svg
    className={styles.optionIcon}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="7" cy="7" r="1" />
    <path d="M11 7h8" />
    <circle cx="7" cy="12" r="1" />
    <path d="M11 12h8" />
    <circle cx="7" cy="17" r="1" />
    <path d="M11 17h8" />
  </svg>
);

export function AnalysisModeDrawer({ onClose }: Props) {
  return (
    <DrawerLayout>
      <div className={styles.container}>
        <h1 className={styles.heading}>Что разбираем?</h1>

        <div className={styles.options}>
          <button
            type="button"
            className={styles.option}
            onClick={() => onClose('foods-only')}
          >
            <span className={styles.optionTitleRow}>
              <FoodIcon />
              <span className={styles.optionTitle}>Только еда</span>
            </span>
            <span className={styles.optionHint}>
              Баланс БЖУ, частые продукты, паттерны питания.
            </span>
          </button>

          <button
            type="button"
            className={styles.option}
            onClick={() => onClose('foods-and-events')}
          >
            <span className={styles.optionTitleRow}>
              <FoodAndEventsIcon />
              <span className={styles.optionTitle}>Еда и события</span>
            </span>
            <span className={styles.optionHint}>
              Полный разбор: еда + теги, симптомы, ощущения.
            </span>
          </button>
        </div>
      </div>
    </DrawerLayout>
  );
}
