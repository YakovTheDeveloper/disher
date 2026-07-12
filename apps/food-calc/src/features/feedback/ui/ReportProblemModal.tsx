import { useEffect, useRef, useState } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { Text } from '@/shared/ui/atoms/Typography';
import toaster from '@/shared/lib/toaster/toaster';
import { submitUserReport } from '../api/submitUserReport';
import { REPORT_PROBLEM_INPUT_ID } from '../model/constants';
import s from './ReportProblemModal.module.scss';

type Props = {
  isExpanded: boolean;
  onClose: () => void;
};

// Упрощённый прод-репорт: одно поле-описание, отправка в pg (см. submitUserReport).
// `position="fixed"` — накрывает дровер настроек сверху (см. ModalByLabel). Черновик
// сбрасывается при каждом открытии — репорт всегда с чистого листа.
export function ReportProblemModal({ isExpanded, onClose }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Synchronous double-submit guard: `busy` (state) only flips on the next
  // render, so a fast double-tap could fire two POSTs before the button
  // disables. The ref closes that window on the very first call.
  const submittingRef = useRef(false);

  useEffect(() => {
    if (isExpanded) {
      setValue('');
      setError(null);
      setBusy(false);
      submittingRef.current = false;
    }
  }, [isExpanded]);

  // Фокус на поле при разворачивании. Ряд-триггер — <button>, а не label-focus
  // delegation, поэтому фокус ставим руками (после кадра, чтобы .collapsed успел
  // сняться). Desktop открывает каретку; на iOS .focus() вне жеста заблокирован —
  // поле видно, юзер тапает сам (паритет с прежним modalStore-флоу баг-репорта).
  useEffect(() => {
    if (!isExpanded) return;
    const t = setTimeout(() => {
      document.getElementById(REPORT_PROBLEM_INPUT_ID)?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [isExpanded]);

  const canSend = value.trim().length > 0 && !busy;

  const handleSubmit = async () => {
    if (!canSend || submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await submitUserReport(value.trim());
      toaster.success('Спасибо! Мы получили ваше сообщение');
      onClose();
    } catch (e) {
      // Держим модалку открытой с черновиком — отправку можно повторить.
      setError(e instanceof Error ? e.message : 'Не удалось отправить');
      setBusy(false);
      submittingRef.current = false;
    }
  };

  return (
    <ModalByLabel
      position="fixed"
      isExpanded={isExpanded}
      className={s.overlay}
      content={
        <ModalShell>
          <ModalShell.Header title="Сообщить о проблеме" onBack={onClose} />
          <ModalShell.Body>
            <AutoGrowSearch
              id={REPORT_PROBLEM_INPUT_ID}
              value={value}
              onChange={setValue}
              placeholder="Опишите, что пошло не так или что хотелось бы улучшить…"
              maxLength={4000}
              maxRows={8}
              collapseOnBlur={false}
            />
            {error && (
              <Text role="caption" className={s.error}>
                {error}
              </Text>
            )}
            {isExpanded && (
              <ModalShell.ActionButtons
                debugId="report-problem"
                right={
                  <ModalNextButton
                    onClick={handleSubmit}
                    variant="finish"
                    label={busy ? 'Отправка…' : 'Отправить'}
                    disabled={!canSend}
                  />
                }
              />
            )}
            <ModalShell.Spacer />
          </ModalShell.Body>
        </ModalShell>
      }
    />
  );
}

export default ReportProblemModal;
