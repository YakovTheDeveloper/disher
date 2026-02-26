import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import styles from './ScheduleEventCategoryList.module.scss';
import { SearchListItem } from '@/components/ui/atoms/SearchListItem';
import { Instance } from 'mobx-state-tree';
import {
  ScheduleEventItem,
  ScheduleEventType,
} from '@/domain/schedule/scheduleEvent/ScheduleEvent.model';
import {
  EventCategory,
  EVENT_CATEGORIES,
  getEventTypeDefinition,
  BaseEventType,
  BaseGroupEventType,
} from '@/domain/schedule/scheduleEvent/eventTypes';
import { useStore } from '@/store/store';
import clsx from 'clsx';
import { useMemo, useRef, useCallback } from 'react';
import { ColumnLayoutWithFixedHeader } from '@/components/ui/ColumnLayoutWithFixedHeader';

type Props = {
  eventItem: Instance<typeof ScheduleEventItem>;
  onFinish: () => void;
};

const CATEGORIES: { key: BaseGroupEventType; icon: string }[] = [
  { key: 'physical', icon: 'pulse' },
  { key: 'mental', icon: 'brain' },
  { key: 'activity', icon: 'activity' },
  { key: 'social', icon: 'users' },
  { key: 'notes', icon: 'note' },
  { key: 'work', icon: 'briefcase' },
  { key: 'learning', icon: 'book' },
  { key: 'environment', icon: 'globe' },
  { key: 'digital', icon: 'monitor' },
  { key: 'life_events', icon: 'star' },
];

const EVENT_TYPES_BY_CATEGORY: Record<BaseGroupEventType, ScheduleEventType[]> = {
  physical: [
    'sleep',
    'illness',
    'digestion',
    'medication',
    'weight',
    'vitals',
    'hydration',
    'pain',
    'allergy',
    'skin',
    'female_health',
    'doctor',
    'treatment',
    'nap',
    'rest',
    'active_recovery',
  ],
  mental: [
    'mood',
    'energy',
    'stress',
    'focus',
    'anxiety',
    'relaxation',
    'meditation',
    'creativity',
    'anger',
    'motivation',
    'therapy',
  ],
  activity: ['sport', 'activity', 'hobby', 'chores', 'transport'],
  social: ['social', 'online', 'family', 'partner', 'work_social'],
  notes: ['note', 'custom', 'gratitude', 'idea', 'task', 'goal', 'reflection'],
  work: ['work'],
  learning: ['learning'],
  environment: ['environment'],
  digital: ['digital'],
  life_events: ['life_events'],
};

// Grouped event types for scroll navigation
const GROUPED_EVENT_TYPES = CATEGORIES.map(({ key }) => ({
  category: key,
  types: EVENT_TYPES_BY_CATEGORY[key],
}));

function getIcon(value: ScheduleEventType) {
  return <span className={clsx([styles.icon, styles[`icon-${value}`]])} />;
}

function getCategoryEmoji(category: EventCategory): string {
  const emojis: Record<EventCategory, string> = {
    physical: '💪',
    mental: '🧠',
    activity: '⚡',
    social: '👥',
    notes: '📝',
    work: '💼',
    learning: '📚',
    environment: '🌍',
    digital: '📱',
    life_events: '🎉',
  };
  return emojis[category];
}

const CategoryImage = ({ category }: { category: EventCategory }) => {
  return <div className={clsx(styles.categoryImage, styles[`${category}-illustration`])} />;
};

const ScheduleEventCategoryList = ({ eventItem, onFinish }: Props) => {
  const { t } = useTranslation();
  const dayScheduleStore = useStore().scheduleStore;

  // Refs for scroll navigation
  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<BaseGroupEventType, HTMLDivElement | null>>({
    physical: null,
    mental: null,
    activity: null,
    social: null,
    notes: null,
  });

  const mostUsedTypes = useMemo(() => dayScheduleStore.getMostUsedEventTypes(), [dayScheduleStore]);

  const handleTypeSelect = (type: ScheduleEventType) => {
    eventItem.updateType(type);
    onFinish();
  };

  // Gradient values for background animation
  const transparentGradient =
    'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0) 100%)';
  const shadowGradient =
    'linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 70%, rgba(0, 0, 0, 0.15) 100%)';

  const headerContent = (
    <div className={styles.imageContainer}>
      <CategoryImage category={eventItem.typeGroupView} />
    </div>
  );

  const content = (
    <>
      {/* Most Often Section */}
      {mostUsedTypes.length > 0 && (
        <div className={styles.mostOften}>
          <span className={styles.mostOftenLabel}>⭐ {t('common.frequent')}:</span>
          <div className={styles.mostOftenList}>
            {mostUsedTypes.map((type) => (
              <button
                key={type}
                className={clsx(styles.mostOftenChip, {
                  [styles.mostOftenChipActive]: eventItem.type === type,
                })}
                onClick={() => handleTypeSelect(type)}
              >
                {t(`event.${type}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event List - All Categories with Sticky Headers */}
      <div className={styles.list} ref={listRef}>
        {/* Most Often Section at top of list */}
        {mostUsedTypes.length > 0 && (
          <div className={styles.mostOftenSection}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>⭐</span>
              {t('common.frequent')}
            </h3>
            <div className={styles.grid}>
              {mostUsedTypes.map((eventType) => (
                <SearchListItem
                  key={eventType}
                  item={{ name: t(`event.${eventType}`) }}
                  active={eventItem.type === eventType}
                  onClick={() => handleTypeSelect(eventType)}
                  onInfoClick={() => {}}
                  decorativeAfterElement={getIcon(eventType)}
                  className=""
                >
                  {t(`event.${eventType}`)}
                </SearchListItem>
              ))}
            </div>
          </div>
        )}

        {/* Category Sections */}
        {GROUPED_EVENT_TYPES.map(({ category, types }) => (
          <div
            key={category}
            ref={(el) => {
              sectionRefs.current[category] = el;
            }}
            data-category={category}
            className={styles.categorySection}
          >
            <h3 className={styles.categoryHeader}>
              <span className={styles.categoryHeaderIcon}>{getCategoryEmoji(category)}</span>
              {t(EVENT_CATEGORIES[category].localizationKey)}
            </h3>
            <div className={styles.grid}>
              {types.map((eventType) => (
                <SearchListItem
                  key={eventType}
                  item={{ name: t(`event.${eventType}`) }}
                  active={eventItem.type === eventType}
                  onClick={() => handleTypeSelect(eventType)}
                  onInfoClick={() => {}}
                  decorativeAfterElement={getIcon(eventType)}
                  className=""
                >
                  {t(`event.${eventType}`)}
                </SearchListItem>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <ColumnLayoutWithFixedHeader
      header={headerContent}
      headerGradient={{ initial: transparentGradient, finished: shadowGradient }}
    >
      {content}
    </ColumnLayoutWithFixedHeader>
  );
};

export default observer(ScheduleEventCategoryList);
