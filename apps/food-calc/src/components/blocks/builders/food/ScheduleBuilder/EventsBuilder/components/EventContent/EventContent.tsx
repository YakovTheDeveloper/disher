import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import styles from './EventContent.module.scss';
import { DailyEventData } from '@/components/blocks/builders/food/ScheduleBuilder/EventsBuilder/viewModel/EventsBuilderViewModel';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  onSelect: (data: DailyEventData) => void;
  onFinish: () => void;
  schedule: {
    currentDailyEventData: DailyEventData | null;
  };
};

type VariantKey = DailyEventData['variant'];
type DigestionSubKey = 'bloating' | 'stomach_pain' | 'heartburn' | 'constipation' | 'diarrhea';

const variantOptions: VariantKey[] = ['sleep', 'mood', 'energy', 'activity', 'note', 'digestion'];

const EventContent = observer(({ onSelect, onFinish, schedule }: Props) => {
  const [selected, setSelected] = useState<VariantKey | null>(null);
  const [selectedSub, setSelectedSub] = useState<DigestionSubKey | null>(null);
  const [formData, setFormData] = useState<any>({});

  const current = schedule.currentDailyEventData;

  // initialize from current if editing
  useEffect(() => {
    if (current) {
      setSelected(current.variant);
      if (current.variant === 'digestion') {
        setSelectedSub(current.content.variant);
        setFormData({ value: current.content.value });
      } else {
        setFormData(current.content);
      }
    }
  }, [current]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    // digestion handled separately
    if (selected === 'digestion') return;

    onSelect({
      variant: selected,
      content: formData,
    });
    onFinish();
  };

  const handleDigestionSave = () => {
    if (!selectedSub) return;
    onSelect({
      variant: 'digestion',
      content: {
        variant: selectedSub,
        value: formData.value,
      },
    });
    onFinish();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{current ? 'Редактировать' : 'Добавить событие'}</h2>

      {/* Step 1: Select variant */}
      {!selected && (
        <div className={styles.variantList}>
          {variantOptions.map((variant) => (
            <button
              key={variant}
              className={styles.variantButton}
              onClick={() => {
                setSelected(variant);
                setFormData({});
              }}
            >
              {variant}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Fill form */}
      {selected && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => {
              if (selectedSub) {
                setSelectedSub(null);
                setFormData({});
              } else {
                setSelected(null);
                setFormData({});
              }
            }}
          >
            ← Назад
          </button>

          <h3 className={styles.formTitle}>{selected}</h3>

          {/* 💤 Sleep */}
          {selected === 'sleep' && (
            <>
              <label className={styles.label}>Quality (1–10)</label>
              <div className={styles.sliderWrapper}>
                <div className={styles.sliderValue}>{formData.quality ?? 5}</div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  className={styles.slider}
                  value={formData.quality ?? 5}
                  onChange={(e) => handleChange('quality', Number(e.target.value))}
                />
              </div>

              <label className={styles.label}>Hours</label>
              <input
                type="number"
                className={styles.input}
                value={formData.hours ?? ''}
                onChange={(e) => handleChange('hours', Number(e.target.value))}
                placeholder="0–10"
              />
              <div className={styles.quickButtons}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`${styles.quickButton} ${
                      formData.hours === h ? styles.activeButton : ''
                    }`}
                    onClick={() => handleChange('hours', h)}
                  >
                    {h}
                  </button>
                ))}
              </div>

              <label className={styles.label}>Minutes</label>
              <input
                type="number"
                className={styles.input}
                value={formData.minutes ?? ''}
                onChange={(e) => handleChange('minutes', Number(e.target.value))}
                placeholder="0–55"
              />
              <div className={styles.quickButtons}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.quickButton} ${
                      formData.minutes === m ? styles.activeButton : ''
                    }`}
                    onClick={() => handleChange('minutes', m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 😊 Mood */}
          {selected === 'mood' && (
            <>
              <label className={styles.label}>Mood (1–10)</label>
              <input
                type="range"
                min="1"
                max="10"
                className={styles.slider}
                value={formData.value ?? 5}
                onChange={(e) => handleChange('value', Number(e.target.value))}
              />
            </>
          )}

          {/* ⚡ Energy */}
          {selected === 'energy' && (
            <>
              <label className={styles.label}>Energy (1–10)</label>
              <input
                type="range"
                min="1"
                max="10"
                className={styles.slider}
                value={formData.value ?? 5}
                onChange={(e) => handleChange('value', Number(e.target.value))}
              />
            </>
          )}

          {/* 🧠 Note */}
          {selected === 'note' && (
            <>
              <label className={styles.label}>Note</label>
              <textarea
                className={styles.textarea}
                value={formData.value ?? ''}
                onChange={(e) => handleChange('value', e.target.value)}
              />
            </>
          )}

          {/* 🏃 Activity */}
          {selected === 'activity' && (
            <>
              <label className={styles.label}>Type</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. running"
                value={formData.variant ?? ''}
                onChange={(e) => handleChange('variant', e.target.value)}
              />
              <div className={styles.quickButtons}>
                {['Спортзал', 'Прогулка', 'Бег'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.quickButton} ${
                      formData.variant === m ? styles.activeButton : ''
                    }`}
                    onClick={() => handleChange('variant', m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <label className={styles.label}>Hours</label>
              <input
                type="number"
                className={styles.input}
                value={formData.hours ?? ''}
                onChange={(e) => handleChange('hours', Number(e.target.value))}
              />
              <div className={styles.quickButtons}>
                {[0, 1, 2, 3, 4].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.quickButton} ${
                      formData.hours === m ? styles.activeButton : ''
                    }`}
                    onClick={() => handleChange('hours', m)}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <label className={styles.label}>Minutes</label>
              <input
                type="number"
                className={styles.input}
                value={formData.minutes ?? ''}
                onChange={(e) => handleChange('minutes', Number(e.target.value))}
              />
              <div className={styles.quickButtons}>
                {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`${styles.quickButton} ${
                      formData.minutes === m ? styles.activeButton : ''
                    }`}
                    onClick={() => handleChange('minutes', m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 🦠 Digestion */}
          {selected === 'digestion' && (
            <div className={styles.digestionContainer}>
              <AnimatePresence mode="wait">
                {!selectedSub && (
                  <motion.div
                    key="digestion-list"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className={styles.variantList}
                  >
                    {['bloating', 'stomach_pain', 'heartburn', 'constipation', 'diarrhea'].map(
                      (key) => (
                        <button
                          key={key}
                          className={styles.variantButton}
                          onClick={() => {
                            setSelectedSub(key as DigestionSubKey);
                            setFormData({ value: 5 });
                          }}
                        >
                          {key.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </motion.div>
                )}

                {selectedSub && (
                  <motion.div
                    key="digestion-input"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25 }}
                    className={styles.digestionForm}
                  >
                    <h4 className={styles.subTitle}>{selectedSub.replace('_', ' ')}</h4>

                    <div className={styles.sliderWrapper}>
                      <div className={styles.sliderValue}>{formData.value ?? 5}</div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        className={styles.slider}
                        value={formData.value ?? 5}
                        onChange={(e) => handleChange('value', Number(e.target.value))}
                      />
                    </div>

                    <button
                      type="button"
                      className={styles.submitButton}
                      onClick={handleDigestionSave}
                    >
                      Save
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {selected !== 'digestion' && (
            <button type="submit" className={styles.submitButton}>
              Save
            </button>
          )}
        </form>
      )}
    </div>
  );
});

export default EventContent;
