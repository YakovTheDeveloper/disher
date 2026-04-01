import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@livestore/react';
import { parse, format } from 'date-fns';
import styles from './SchedulePeriods.module.scss';
import { usePeriods, addPeriod, removePeriod } from '@/entities/period';
import { safeMutate } from '@/shared/lib/safeMutate';
import { drawerStore } from '@/shared/ui/drawer-store';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { ModalShell } from '@/shared/ui/ModalShell/ModalShell';
import { ModalPrevButton, ModalNextButton } from '@/shared/ui/ModalFooter';
import { Tabs } from '@/shared/ui/Tabs';
import type { Tab } from '@/shared/ui/Tabs';

const COLOR_CLASSES = [
  styles.color0,
  styles.color1,
  styles.color2,
  styles.color3,
  styles.color4,
  styles.color5,
];

const COLOR_VALUES = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

const FONTS = ['sans', 'serif', 'mono'] as const;
const FONT_SIZES = [12, 14, 16, 18, 20] as const;

const emptyForm = {
  name: '',
  colorIndex: 0,
  fontFamily: 'sans' as const,
  fontSize: 16,
};

// Confirmation drawer for deletion
const DeletePeriodDrawer = ({ onClose, periodName }: BaseDrawerProps<boolean> & { periodName: string }) => (
  <DrawerLayout>
    <div style={{ padding: 'var(--space-6) var(--space-4)', textAlign: 'center' }}>
      <p style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-4)' }}>
        Удалить период «{periodName}»?
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button className={`${styles.formButton} ${styles.formButtonSecondary}`} onClick={() => onClose(false)} style={{ flex: 1 }}>
          Отмена
        </button>
        <button className={`${styles.formButton} ${styles.formButtonPrimary}`} onClick={() => onClose(true)} style={{ flex: 1 }}>
          Удалить
        </button>
      </div>
    </div>
  </DrawerLayout>
);

type SchedulePeriodsProps = {
  date?: string; // dd-MM-yyyy
  onClose?: () => void;
};

const formatDateTab = (dateStr: string): string => {
  const parsed = parse(dateStr, 'dd-MM-yyyy', new Date());
  return format(parsed, 'dd-MM-yy');
};

export const SchedulePeriods = ({ date, onClose }: SchedulePeriodsProps) => {
  const { store } = useStore();
  const periods = usePeriods();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  // Default tab is 'day' (date) when date is provided
  const [activeTab, setActiveTab] = useState<'periods' | 'day'>(date ? 'day' : 'periods');

  // Delay ActionButtons appearance so drawer layout has time to build
  const [showActions, setShowActions] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowActions(true), 350);
    return () => clearTimeout(timer);
  }, []);

  const tabs: Tab[] = useMemo(() => [
    ...(date ? [{ value: 'day', alternativeLabel: formatDateTab(date) }] : []),
    { value: 'periods', alternativeLabel: 'Периоды' },
  ], [date]);

  const handleAdd = () => {
    if (!form.name.trim()) return;

    safeMutate(
      () => addPeriod(store, {
        name: form.name.trim(),
        colorIndex: form.colorIndex,
        fontFamily: form.fontFamily,
        fontSize: form.fontSize,
      }),
      'Не удалось создать период',
    );

    setForm(emptyForm);
    setShowForm(false);
  };

  const handleRemove = async (id: string, name: string) => {
    const confirmed = await drawerStore.show(DeletePeriodDrawer, { periodName: name });
    if (confirmed) {
      safeMutate(() => removePeriod(store, id), 'Не удалось удалить период');
    }
  };

  const handlePrev = () => {
    if (showForm) {
      setShowForm(false);
      setForm(emptyForm);
    } else if (onClose) {
      onClose();
    }
  };

  const periodsList = periods;

  return (
    <div className={styles.container}>
      <Tabs tabs={tabs} current={activeTab} setTab={(v) => setActiveTab(v as 'periods' | 'day')} />

      {/* Date tab — title input and period settings */}
      {activeTab === 'day' && (
        <>
          <div className={styles.titleSection}>
            <span className={styles.titleLabel}>В двух словах{'\n'}о текущем периоде жизни?</span>
            <input
              className={styles.titleInput}
              placeholder="Пост, диета, оздоровление…"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={50}
            />
          </div>

          {showForm && (
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                handleAdd();
              }}
            >
              <div className={styles.formField}>
                <label className={styles.formLabel}>Цвет</label>
                <div className={styles.colorGrid}>
                  {COLOR_VALUES.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.colorButton} ${form.colorIndex === idx ? styles.selected : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setForm((f) => ({ ...f, colorIndex: idx }))}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Шрифт</label>
                  <select
                    className={styles.formInput}
                    value={form.fontFamily}
                    onChange={(e) => setForm((f) => ({ ...f, fontFamily: e.target.value as typeof form.fontFamily }))}
                  >
                    {FONTS.map((font) => (
                      <option key={font} value={font}>
                        {font === 'sans' ? 'Без засечек' : font === 'serif' ? 'С засечками' : 'Моношрифт'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Размер</label>
                  <select
                    className={styles.formInput}
                    value={form.fontSize}
                    onChange={(e) => setForm((f) => ({ ...f, fontSize: Number(e.target.value) }))}
                  >
                    {FONT_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size}px
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          )}

          {showActions && (
            <ModalShell.ActionButtons
              debugId="schedule-periods-day"
              left={
                <ModalPrevButton onClick={handlePrev} />
              }
              right={
                <ModalNextButton onClick={() => {
                  if (showForm) {
                    handleAdd();
                  } else {
                    setShowForm(true);
                  }
                }} />
              }
            />
          )}
        </>
      )}

      {/* Periods tab — list of existing periods */}
      {activeTab === 'periods' && (
        <>
          <div className={styles.list}>
            {periodsList.length === 0 && (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>◇</span>
                <span className={styles.emptyText}>
                  Создайте период — пост, диету
                  <br />
                  или любой другой отрезок времени
                </span>
              </div>
            )}

            {periodsList.map((period) => (
              <div
                key={period.id}
                className={styles.periodCard}
                onClick={() => handleRemove(period.id, period.name)}
              >
                <div
                  className={`${styles.periodName} ${COLOR_CLASSES[period.colorIndex]}`}
                  style={{
                    fontFamily: period.fontFamily === 'serif' ? 'Georgia, serif' : period.fontFamily === 'mono' ? 'monospace' : 'system-ui, -apple-system, sans-serif',
                    fontSize: `${period.fontSize}px`,
                  }}
                >
                  {period.name}
                </div>
              </div>
            ))}
          </div>

          {showActions && (
            <ModalShell.ActionButtons
              debugId="schedule-periods"
              left={
                <ModalPrevButton onClick={handlePrev} />
              }
              right={null}
            />
          )}
        </>
      )}
    </div>
  );
};
