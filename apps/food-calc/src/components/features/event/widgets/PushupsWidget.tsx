import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './PushupsWidget.module.scss';
import { SliderField } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent/shared';
import { TextInput } from '@/components/ui/atoms/input/TextInput';

/**
 * Виджет для отслеживания отжиманий
 * Регистрируется в FormRegistry для: activity.exercise.pushups
 */
interface Props {
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  errors?: Record<string, string>;
}

export const PushupsWidget: React.FC<Props> = ({ values, onChange, errors }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>{t('widget.pushups.title')}</h4>

      <SliderField
        label={t('widget.pushups.count')}
        value={values.pushupsCount || 0}
        onChange={(val) => onChange('pushupsCount', val)}
        min={0}
        max={100}
        className={styles.field}
      />

      <SliderField
        label={t('widget.pushups.sets')}
        value={values.pushupsSets || 1}
        onChange={(val) => onChange('pushupsSets', val)}
        min={1}
        max={10}
        className={styles.field}
      />

      <TextInput
        label={t('widget.pushups.notes')}
        value={values.pushupsNotes || ''}
        onChange={(val) => onChange('pushupsNotes', val)}
        placeholder={t('widget.pushups.notesPlaceholder')}
        className={styles.field}
      />
    </div>
  );
};
