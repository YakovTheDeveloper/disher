import { SheetCard } from '@/shared/ui/SheetCard';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { ScaleSlider } from '@/shared/ui/ScaleSlider';
import { IconButton } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Typography';
import { EmptyState } from '@/shared/ui/EmptyState';
import CrossIcon from '@/shared/assets/icons/cross.svg?react';
import type { UseWriteEventFlowResult } from '../model/useWriteEventFlow';
import styles from './InlineWriteEventReview.module.scss';

export interface InlineWriteEventReviewProps {
  flow: UseWriteEventFlowResult;
}

// Крестик карточки = soft-delete/undo (Todoist канон, зеркалит еду): на погашенной
// карточке глиф меняется на «вернуть». Оба смонтированы, свич через CSS[data-dismissed].
const DismissButton = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
  <IconButton
    className={styles.dismiss}
    aria-label={enabled ? 'Убрать событие' : 'Вернуть'}
    onClick={onClick}
    icon={
      <span className={styles.dismissGlyphs}>
        <span className={styles.iconDismiss} aria-hidden="true">
          <CrossIcon width={16} height={16} />
        </span>
        <span className={styles.iconUndo} aria-hidden="true">
          ↶
        </span>
      </span>
    }
  />
);

/**
 * Панель разбора события — ниже бара (паттерн еды `InlineWriteFoodReview`, но без
 * каталог-матчинга: событию не с чем сопоставляться). Один bucket: карточка на
 * событие = редактируемое описание + период (две time-ячейки) + оценочные варианты
 * (label + `ScaleSlider`). Крестик гасит карточку (soft-delete), «Добавить N»
 * коммитит включённые. Монтируется только на `ready` (см. EventsWriteBar).
 */
export const InlineWriteEventReview = ({ flow }: InlineWriteEventReviewProps) => {
  const {
    state,
    events,
    totalToAdd,
    isSubmitting,
    toggleEvent,
    updateEvent,
    updateAspect,
    removeAspect,
    commit,
    cancel,
  } = flow;

  if (state !== 'ready') return null;

  return (
    <SheetCard
      className={styles.reviewSheet}
      header="Проверьте события"
      data-state="ready"
      actions={
        <>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => cancel()}
            disabled={isSubmitting}
          >
            <Text as="span" role="body">
              Отменить
            </Text>
          </button>
          <button
            type="button"
            className={styles.commitBtn}
            onClick={() => void commit()}
            disabled={isSubmitting || totalToAdd === 0}
          >
            <Text as="span" role="body">
              {isSubmitting ? 'Добавляем…' : `Добавить${totalToAdd > 0 ? ` ${totalToAdd}` : ''}`}
            </Text>
          </button>
        </>
      }
    >
      {events.length === 0 ? (
        <EmptyState
          className={styles.empty}
          title="Не распознали событий"
          description="Опишите иначе или добавьте вручную через кнопку справа."
        />
      ) : (
        <ul className={styles.list}>
          {events.map((ev) => (
            <li
              key={ev.uid}
              className={styles.eventCard}
              data-dismissed={ev.enabled ? undefined : 'true'}
            >
              <div className={styles.cardHead}>
                <div className={styles.period}>
                  <input
                    type="time"
                    className={styles.timeField}
                    value={ev.timeStart ?? ''}
                    onChange={(e) => updateEvent(ev.uid, { timeStart: e.target.value || null })}
                    aria-label="Начало"
                    data-base-ui-swipe-ignore
                  />
                  <span className={styles.periodDash} aria-hidden="true">
                    –
                  </span>
                  <input
                    type="time"
                    className={styles.timeField}
                    value={ev.timeEnd ?? ''}
                    onChange={(e) => updateEvent(ev.uid, { timeEnd: e.target.value || null })}
                    aria-label="Конец"
                    data-base-ui-swipe-ignore
                  />
                </div>
                <DismissButton enabled={ev.enabled} onClick={() => toggleEvent(ev.uid)} />
              </div>

              <AutoGrowSearch
                value={ev.text}
                onChange={(v) => updateEvent(ev.uid, { text: v })}
                placeholder="Описание события"
                minRows={1}
                className={styles.textField}
              />

              {ev.aspects.length > 0 && (
                <div className={styles.aspects}>
                  {ev.aspects.map((aspect, index) => (
                    <div key={index} className={styles.aspect}>
                      <div className={styles.aspectHead}>
                        <AutoGrowSearch
                          singleLine
                          value={aspect.label}
                          onChange={(v) => updateAspect(ev.uid, index, { label: v })}
                          placeholder="Оценка"
                        />
                        <button
                          type="button"
                          className={styles.removeAspect}
                          onClick={() => removeAspect(ev.uid, index)}
                          aria-label="Убрать оценку"
                        >
                          <CrossIcon width={14} height={14} />
                        </button>
                      </div>
                      <ScaleSlider
                        value={aspect.value}
                        onChange={(v) => updateAspect(ev.uid, index, { value: v })}
                        ariaLabel={aspect.label.trim() || `Оценка ${index + 1}, 0–10`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </SheetCard>
  );
};

export default InlineWriteEventReview;
