import { useState } from 'react';
import { format, differenceInDays, startOfToday, addDays, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './SchedulePeriods.module.scss';
import { usePeriods, addPeriod, removePeriod } from '@/entities/period';
import { drawerStore } from '@/shared/ui/drawer-store';
import type { BaseDrawerProps } from '@/shared/ui/overlay-types';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';

const COLORS = [
  styles.color0,
  styles.color1,
  styles.color2,
  styles.color3,
  styles.color4,
  styles.color5,
];

const formatDate = (dateStr: string) => {
  const d = parse(dateStr, 'dd-MM-yyyy', new Date());
  return format(d, 'd MMM', { locale: ru });
};

const getProgress = (startStr: string, endStr: string) => {
  const start = parse(startStr, 'dd-MM-yyyy', new Date());
  const end = parse(endStr, 'dd-MM-yyyy', new Date());
  const today = startOfToday();
  const total = differenceInDays(end, start);
  if (total <= 0) return 100;
  const elapsed = differenceInDays(today, start);
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
};

const emptyForm = {
  name: '',
  description: '',
  startDate: format(startOfToday(), 'yyyy-MM-dd'),
  endDate: format(addDays(startOfToday(), 7), 'yyyy-MM-dd'),
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

export const SchedulePeriods = () => {
  const { results: periods } = usePeriods();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleAdd = async () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;

    const toInternal = (isoDate: string) => {
      const [y, m, d] = isoDate.split('-');
      return `${d}-${m}-${y}`;
    };

    await addPeriod({
      name: form.name.trim(),
      description: form.description.trim() || null,
      startDate: toInternal(form.startDate),
      endDate: toInternal(form.endDate),
      colorIndex: (periods?.length ?? 0) % COLORS.length,
    });

    setForm(emptyForm);
    setShowForm(false);
  };

  const handleRemove = async (id: string, name: string) => {
    const confirmed = await drawerStore.show(DeletePeriodDrawer, { periodName: name });
    if (confirmed) {
      await removePeriod(id);
    }
  };

  const periodsList = periods ?? [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Периоды</span>
        <button className={styles.addButton} onClick={() => setShowForm((v) => !v)}>
          {showForm ? '×' : '+'}
        </button>
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
            <label className={styles.formLabel}>Название</label>
            <input
              className={styles.formInput}
              placeholder="Пост, диета, оздоровление…"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Описание</label>
            <input
              className={styles.formInput}
              placeholder="Необязательно"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Начало</label>
              <input
                className={styles.formInput}
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Конец</label>
              <input
                className={styles.formInput}
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className={`${styles.formButton} ${styles.formButtonSecondary}`}
              onClick={() => {
                setShowForm(false);
                setForm(emptyForm);
              }}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={`${styles.formButton} ${styles.formButtonPrimary}`}
            >
              Добавить
            </button>
          </div>
        </form>
      )}

      <div className={styles.list}>
        {periodsList.length === 0 && !showForm && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>◇</span>
            <span className={styles.emptyText}>
              Создайте период — пост, диету
              <br />
              или любой другой отрезок времени
            </span>
          </div>
        )}

        {periodsList.map((period) => {
          const progress = getProgress(period.startDate, period.endDate);
          return (
            <div
              key={period.id}
              className={styles.periodCard}
              onClick={() => handleRemove(period.id, period.name)}
            >
              <div className={styles.periodTop}>
                <span className={styles.periodName}>{period.name}</span>
                <span className={styles.periodDates}>
                  {formatDate(period.startDate)} — {formatDate(period.endDate)}
                </span>
              </div>
              {period.description && (
                <div className={styles.periodDescription}>{period.description}</div>
              )}
              <div className={styles.ganttBar}>
                <div
                  className={`${styles.ganttFill} ${COLORS[period.colorIndex]}`}
                  style={{ width: `${progress}%`, left: 0 }}
                />
              </div>
              <div className={styles.ganttLabels}>
                <span className={styles.ganttLabel}>{formatDate(period.startDate)}</span>
                <span className={styles.ganttLabel}>{formatDate(period.endDate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
