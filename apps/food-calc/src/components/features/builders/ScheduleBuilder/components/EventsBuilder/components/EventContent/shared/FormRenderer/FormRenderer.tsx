import React, { useState } from 'react';
import styles from './FormRenderer.module.scss';
import { observer } from 'mobx-react-lite';
// import { FormFieldConfig, FormFieldType } from '@/domain/schedule/scheduleEvent/eventForms/types';
import { SliderField } from '../SliderField';
import { GrowingInput } from '@/components/ui/atoms/input/GrowingInput';
import { DurationField } from '../DurationField';
import { SelectField } from '../SelectField';
import { MultiSelectField } from '../MultiSelectField';
import { StepsField } from '../StepsField';
import clsx from 'clsx';
import { QuickButtons } from '@/components/features/builders/shared/atoms/QuickButtons';
import { useTranslation } from 'react-i18next';
import { SubtypeTreeField } from '../SubtypeTreeField';
import { FormFieldConfig, FormFieldType } from '@/domain/schedule/scheduleEvent/eventForms';
import { FormFieldLabel } from '../FormFieldLabel';
import { SliderFieldV2 } from '@/components/features/builders/ScheduleBuilder/components/EventsBuilder/components/EventContent/shared/SliderFieldV2';

type Props = {
  config: FormFieldConfig[];
  data: Record<string, string | number | string[]>;
  onChange: (key: string, value: string | number | string[]) => void;
  errors?: Record<string, string>;
  className?: string;
  subtype: string[];
};

const FIELD_COMPONENTS: Partial<Record<FormFieldType, React.FC<any>>> = {
  slider: SliderFieldV2,
  text: GrowingInput,
  duration: DurationField,
  select: SelectField,
  multiSelect: MultiSelectField,
  steps: StepsField,
  tree: SubtypeTreeField,
};

/**
 * Проверить, должно ли поле быть видимым на основе условия visibleWhen
 */
const isFieldVisible = (field: FormFieldConfig, data: Record<string, any>): boolean => {
  if (!field.visibleWhen) return true;
  const { field: dependentField, equals } = field.visibleWhen;
  return data[dependentField] === equals;
};

const FormRenderer = observer(({ config, data, onChange, errors, className }: Props) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvanced = config.some((f) => f.advanced);
  const visibleConfig = config.filter((f) => {
    // Сначала проверяем visibleWhen условие
    if (!isFieldVisible(f, data)) return false;
    // Затем проверяем advanced
    if (hasAdvanced && f.advanced && !showAdvanced) return false;
    return true;
  });

  const handleChange = (key: string, value: any) => {
    onChange(key, value);
  };

  const renderField = (field: FormFieldConfig) => {
    const currentValue = data[field.key];
    const error = errors?.[field.key];
    const Component = FIELD_COMPONENTS[field.type];

    const subtype = data.subtype;

    if (!Component) {
      console.warn(`Unknown field type: ${field.type}`);
      return null;
    }

    const showLabel = field.showLabel !== false;
    const label = t(field.labelKey);
    const labelElement = showLabel ? (
      <FormFieldLabel
        label={label}
        required={field.validation?.required}
        error={error}
        aside={field.labelAside}
      />
    ) : null;

    const spreadProps = {
      value: currentValue,
      onChange: (val: any) => handleChange(field.key, val),
      className: clsx(styles.field, error && styles.fieldError),
      error,
    };

    switch (field.type) {
      case 'slider':
        return (
          <div key={field.key} className={styles.field}>
            {labelElement}
            <Component
              {...spreadProps}
              min={field.validation?.min ?? 0}
              max={field.validation?.max ?? 10}
              label={label}
            />
          </div>
        );

      case 'quick-buttons':
        return (
          <div key={field.key} className={styles.field}>
            {labelElement}
            {field.options && (
              <QuickButtons
                options={field.options.map((o) => Number(o.value))}
                selectedValue={currentValue as number}
                onSelect={(val) => handleChange(field.key, val)}
              />
            )}
          </div>
        );

      case 'text':
        return (
          <div key={field.key} className={styles.field}>
            {labelElement}
            <Component key={field.key} {...spreadProps} placeholder={label} />
          </div>
        );

      case 'duration':
        return (
          <div key={field.key} className={styles.field}>
            {labelElement}
            <Component {...spreadProps} label={label} />
          </div>
        );

      case 'select':
        return (
          <div key={field.key} className={styles.field}>
            {labelElement}
            <Component
              {...spreadProps}
              label={label}
              options={
                field.options?.map((o) => ({
                  value: o.value,
                  label: t(o.labelKey),
                })) || []
              }
            />
          </div>
        );

      case 'multiSelect':
        return (
          <div key={field.key} className={styles.field}>
            {labelElement}
            <Component
              {...spreadProps}
              label={label}
              options={
                field.options?.map((o) => ({
                  value: o.value,
                  label: t(o.labelKey),
                })) || []
              }
            />
          </div>
        );

      case 'steps':
        return (
          <div key={field.key} className={styles.field}>
            {labelElement}
            <Component
              {...spreadProps}
              label={label}
              min={field.validation?.min ?? 0}
              max={field.validation?.max ?? 100000}
              step={field.step ?? 1}
            />
          </div>
        );

      case 'tree':
        return (
          <div key={field.key} className={styles.field}>
            {labelElement}
            <Component
              {...spreadProps}
              label={label}
              options={field.options || []}
              maxDepth={field.maxDepth}
              subtype={subtype}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={clsx(styles.container, className)}>
      {visibleConfig.map(renderField)}

      {hasAdvanced && (
        <button
          type="button"
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? t('common.hideAdvanced') : t('common.showAdvanced')}
        </button>
      )}
    </div>
  );
});

export default FormRenderer;
