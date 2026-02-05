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

type Props = {
  config: FormFieldConfig[];
  values: Record<string, string | number | string[]>;
  onChange: (key: string, value: string | number | string[]) => void;
  errors?: Record<string, string>;
  className?: string;
};

const FIELD_COMPONENTS: Partial<Record<FormFieldType, React.FC<any>>> = {
  slider: SliderField,
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
const isFieldVisible = (field: FormFieldConfig, values: Record<string, any>): boolean => {
  if (!field.visibleWhen) return true;
  const { field: dependentField, equals } = field.visibleWhen;
  return values[dependentField] === equals;
};

const FormRenderer = observer(({ config, values, onChange, errors, className }: Props) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasAdvanced = config.some((f) => f.advanced);
  const visibleConfig = config.filter((f) => {
    // Сначала проверяем visibleWhen условие
    if (!isFieldVisible(f, values)) return false;
    // Затем проверяем advanced
    if (hasAdvanced && f.advanced && !showAdvanced) return false;
    return true;
  });

  const handleChange = (key: string, value: any) => {
    onChange(key, value);
  };

  const renderField = (field: FormFieldConfig) => {
    const currentValue = values[field.key];
    const error = errors?.[field.key];
    const Component = FIELD_COMPONENTS[field.type];

    if (!Component) {
      console.warn(`Unknown field type: ${field.type}`);
      return null;
    }

    const label = t(field.labelKey);
    const spreadProps = {
      value: currentValue,
      onChange: (val: any) => handleChange(field.key, val),
      className: clsx(styles.field, error && styles.fieldError),
      error,
    };

    switch (field.type) {
      case 'slider':
        return (
          <Component
            key={field.key}
            {...spreadProps}
            min={field.validation?.min ?? 0}
            max={field.validation?.max ?? 10}
            label={label}
          />
        );

      case 'quick-buttons':
        return (
          <div key={field.key} className={styles.field}>
            <div className={styles.fieldLabel}>{label}</div>
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
        return <Component key={field.key} {...spreadProps} label={label} placeholder={label} />;

      case 'duration':
        return <Component key={field.key} {...spreadProps} label={label} />;

      case 'select':
        return (
          <Component
            key={field.key}
            {...spreadProps}
            label={label}
            options={
              field.options?.map((o) => ({
                value: o.value,
                label: t(o.labelKey),
              })) || []
            }
          />
        );

      case 'multiSelect':
        return (
          <Component
            key={field.key}
            {...spreadProps}
            label={label}
            options={
              field.options?.map((o) => ({
                value: o.value,
                label: t(o.labelKey),
              })) || []
            }
          />
        );

      case 'steps':
        return (
          <Component
            key={field.key}
            {...spreadProps}
            label={label}
            min={field.validation?.min ?? 0}
            max={field.validation?.max ?? 100000}
            step={field.step ?? 1}
          />
        );

      case 'tree':
        return (
          <Component
            key={field.key}
            {...spreadProps}
            label={label}
            options={field.options || []}
            maxDepth={field.maxDepth}
          />
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
