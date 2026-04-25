import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import LabeledCheckbox from '@/shared/ui/LabeledCheckbox/LabeledCheckbox';

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

const LONG_PRESS_MS = 500;

type PeriodCardProps = {
  period: { id: string; name: string; colorIndex: number; fontFamily: string; fontSize: number };
  onTap: (id: string) => void;
  onLongPress: (id: string, name: string) => void;
  appliedId: string | null;
};

const PeriodCard = ({ period, onTap, onLongPress, appliedId }: PeriodCardProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const isTouchRef = useRef(false);

  const startPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // Prevent mouse events from firing after touch events
    if (e.type === 'touchstart') isTouchRef.current = true;
    if (e.type === 'mousedown' && isTouchRef.current) return;

    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress(period.id, period.name);
    }, LONG_PRESS_MS);
  }, [period.id, period.name, onLongPress]);

  const endPress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (e.type === 'mouseup' && isTouchRef.current) {
      isTouchRef.current = false;
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (firedRef.current) {
      // Long press already fired — block the event from propagating
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    onTap(period.id);
  }, [period.id, onTap]);

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const isApplied = appliedId === period.id;

  return (
    <div
      data-period-id={period.id}
      className={`${styles.periodCard} ${isApplied ? styles.periodCardApplied : ''}`}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={cancelPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
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
      {isApplied && <span className={styles.appliedBadge}>✓ Применён</span>}
    </div>
  );
};

type SchedulePeriodsProps = {
  date?: string; // dd-MM-yyyy
  onClose?: () => void;
  onPeriodCreated?: (periodId: string) => void;
};

const formatDateTab = (dateStr: string): string => {
  const parsed = parse(dateStr, 'dd-MM-yyyy', new Date());
  return format(parsed, 'dd-MM-yy');
};

export const SchedulePeriods = ({ date, onClose, onPeriodCreated }: SchedulePeriodsProps) => {
  const periods = usePeriods();
  const [form, setForm] = useState(emptyForm);
  const [stylingOpen, setStylingOpen] = useState(false);
  const [applyToCurrentDay, setApplyToCurrentDay] = useState(true);
  // Default tab is 'day' (date) when date is provided
  const [activeTab, setActiveTab] = useState<'periods' | 'day'>(date ? 'day' : 'periods');
  const createdPeriodRef = useRef<string | null>(null);

  // Delay ActionButtons appearance so modal has time to expand
  const [showActions, setShowActions] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowActions(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const tabs: Tab[] = useMemo(() => [
    ...(date ? [{ value: 'day', alternativeLabel: formatDateTab(date) }] : []),
    { value: 'periods', alternativeLabel: 'Периоды' },
  ], [date]);

  const handleAdd = async () => {
    if (!form.name.trim()) return;

    const periodId = await safeMutate(
      () => addPeriod({
        name: form.name.trim(),
        colorIndex: form.colorIndex,
        fontFamily: form.fontFamily,
        fontSize: form.fontSize,
      }),
      'Не удалось создать период',
    );

    if (periodId && onPeriodCreated) {
      onPeriodCreated(periodId);
    }

    if (applyToCurrentDay) {
      setForm(emptyForm);
      setStylingOpen(false);
      if (onClose) onClose();
    } else {
      createdPeriodRef.current = periodId ?? null;
      setForm(emptyForm);
      setStylingOpen(false);
      setActiveTab('periods');
    }
  };

  // Scroll to newly created period when switching to periods tab
  useEffect(() => {
    if (activeTab === 'periods' && createdPeriodRef.current) {
      const id = createdPeriodRef.current;
      createdPeriodRef.current = null;
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-period-id="${id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [activeTab]);

  const [appliedPeriodId, setAppliedPeriodId] = useState<string | null>(null);

  const handleApplyPeriod = useCallback((id: string) => {
    setAppliedPeriodId(id);
    if (onPeriodCreated) onPeriodCreated(id);
  }, [onPeriodCreated]);

  const handleLongPressPeriod = useCallback(async (id: string, name: string) => {
    const confirmed = await drawerStore.show(DeletePeriodDrawer, { periodName: name });
    if (confirmed) {
      void safeMutate(() => removePeriod(id), 'Не удалось удалить период');
      if (appliedPeriodId === id) setAppliedPeriodId(null);
    }
  }, [appliedPeriodId]);

  const handlePrev = () => {
    if (onClose) onClose();
  };

  const periodsList = periods;

  return (
    <div className={styles.container}>
      <Tabs tabs={tabs} current={activeTab} setTab={(v) => setActiveTab(v as 'periods' | 'day')} />

      {/* Date tab — name input + collapsible styling accordion */}
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

          <div className={styles.accordion}>
            <button
              type="button"
              className={styles.accordionToggle}
              onClick={() => setStylingOpen((v) => !v)}
            >
              <span>Оформление</span>
              <span className={`${styles.accordionArrow} ${stylingOpen ? styles.open : ''}`}>▼</span>
            </button>

            {stylingOpen && (
              <div className={styles.accordionBody}>
                <div className={styles.form}>
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
                </div>
              </div>
            )}
          </div>

          <div className={styles.checkboxArea}>
            <LabeledCheckbox
              checked={applyToCurrentDay}
              onChange={setApplyToCurrentDay}
              label="Применить к текущему дню"
            />
          </div>

          {showActions && (
            <ModalShell.ActionButtons
              debugId="schedule-periods-day"
              left={
                <ModalPrevButton onClick={handlePrev} />
              }
              right={
                <ModalNextButton
                  onClick={handleAdd}
                  variant="finish"
                  label="Создать"
                />
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
              <PeriodCard
                key={period.id}
                period={period}
                onTap={handleApplyPeriod}
                onLongPress={handleLongPressPeriod}
                appliedId={appliedPeriodId}
              />
            ))}

            {periodsList.length > 0 && (
              <p className={styles.hint}>Нажмите, чтобы применить. Удержите для удаления.</p>
            )}
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
