import { useState } from 'react';
import { format, differenceInDays, startOfToday, addDays, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import styles from './SchedulePeriods.module.scss';

type Period = {
  id: string;
  name: string;
  description?: string;
  startDate: string; // dd-MM-yyyy
  endDate: string; // dd-MM-yyyy
  colorIndex: number;
};

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

export const SchedulePeriods = () => {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleAdd = () => {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;

    const toInternal = (isoDate: string) => {
      const [y, m, d] = isoDate.split('-');
      return `${d}-${m}-${y}`;
    };

    const newPeriod: Period = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      startDate: toInternal(form.startDate),
      endDate: toInternal(form.endDate),
      colorIndex: periods.length % COLORS.length,
    };

    setPeriods((prev) => [...prev, newPeriod]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    setPeriods((prev) => prev.filter((p) => p.id !== id));
  };

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
        {periods.length === 0 && !showForm && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>◇</span>
            <span className={styles.emptyText}>
              Создайте период — пост, диету
              <br />
              или любой другой отрезок времени
            </span>
          </div>
        )}

        {periods.map((period) => {
          const progress = getProgress(period.startDate, period.endDate);
          return (
            <div
              key={period.id}
              className={styles.periodCard}
              onClick={() => handleRemove(period.id)}
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
