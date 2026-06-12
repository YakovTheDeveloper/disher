import { memo, useCallback, useState } from 'react';
import { parse, isValid, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { BaseModalProps } from '@/shared/ui';
import { ModalLayout } from '@/shared/ui/ModalLayout';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { Heading } from '@/shared/ui/atoms/Typography';
import { useAllHypotheses } from '@/entities/hypothesis';
import HypothesisListPanel from '@/widgets/Laboratory/HypothesisListPanel';
import { useDailyAnalysisStore } from '@/features/analysis/daily';
import { buildStartArgs } from './buildStartArgs';
import s from './AnalysisClarificationModal.module.scss';

// Free-text clamp — kept in sync with the backend (USER_MESSAGE_MAX in
// analyze-daily.ts). The server re-clamps; this is just a UI guardrail.
const MESSAGE_MAX = 1000;

// Last hypothesis selection, remembered for the session so re-opening the modal
// doesn't force re-ticking. Module-level (not persisted): resets on reload,
// which is fine — it's a within-session convenience, not stored state.
let lastSelectedIds: string[] = [];

type Props = BaseModalProps<void> & {
  /** dd-MM-yyyy — the day to analyse. */
  date: string;
};

function formatDay(date: string): string {
  const d = parse(date, 'dd-MM-yyyy', new Date());
  if (!isValid(d)) return date;
  return format(d, 'd MMMM, EEEE', { locale: ru });
}

// «Уточнение разбора» — fullscreen modal opened from AnalysisKindDrawer's
// «Текущий день». Owns its own ephemeral selection (the checkboxes moved here
// off HomePage) + an optional free-text note. «Разобрать» fires the daily
// stream and closes; the result lands in DailyAnalysisSection on screen 0.
const AnalysisClarificationModal = ({ date, onClose }: Props) => {
  const hypotheses = useAllHypotheses();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(lastSelectedIds));
  const [message, setMessage] = useState('');

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  function handleRun() {
    const args = buildStartArgs(hypotheses, selectedIds, message);
    lastSelectedIds = args.hypothesisIds; // remember for the next open this session
    void useDailyAnalysisStore.getState().start(date, args);
    onClose();
  }

  return (
    <ModalLayout a11yLabel="Уточнение разбора">
      <ModalShell variant="spring4">
        <ModalShell.Header
          title="Разбор дня"
          subtitle={formatDay(date)}
          onBack={() => onClose()}
        />
        <ModalShell.Body>
          <div className={s.block}>
            <Heading size="field">Уточнения для нейросети</Heading>
            <AutoGrowSearch
              value={message}
              onChange={setMessage}
              placeholder="Что учесть при разборе? (необязательно)"
              maxRows={8}
              maxLength={MESSAGE_MAX}
              collapseOnBlur={false}
            />
          </div>

          {hypotheses.length > 0 && (
            <div className={s.block}>
              <HypothesisListPanel
                hypotheses={hypotheses}
                selectedIds={selectedIds}
                onToggle={handleToggle}
                maxBodyHeight="none"
              />
            </div>
          )}

          <ModalShell.Spacer />

          <ModalShell.ActionButtons
            debugId="analysis-clarification"
            right={<ModalNextButton onClick={handleRun} variant="finish" label="Разобрать" />}
          />
        </ModalShell.Body>
      </ModalShell>
    </ModalLayout>
  );
};

export default memo(AnalysisClarificationModal);
