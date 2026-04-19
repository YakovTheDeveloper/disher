import { useCallback, useEffect } from 'react';
import { ModalByLabel } from '@/features/shared/components/ModalByLabel';
import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton, ModalPrevButton } from '@/shared/ui/ModalFooter';
import Textarea from '@/shared/ui/atoms/Textarea/Textarea';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import { useOnline } from '@/shared/lib/hooks/useOnline';
import type { UseWriteFoodFlowResult } from '../model/useWriteFoodFlow';
import styles from './WriteFoodModal.module.scss';

export interface WriteFoodModalProps {
  isExpanded: boolean;
  onClose: () => void;
  flow: UseWriteFoodFlowResult;
  placeholder: string;
  inputId: string;
}

const DEFAULT_PLACEHOLDER = 'Например: на завтрак овсянка 200, кофе. В обед борщ 300, хлеб';

export const WriteFoodModal = ({
  isExpanded,
  onClose,
  flow,
  placeholder,
  inputId,
}: WriteFoodModalProps) => {
  const online = useOnline();
  const {
    state,
    inputText,
    errorMessage,
    parseResult,
    submit,
    retry,
    cancel,
    goToReview,
    setInputText,
  } = flow;

  const readyCount = parseResult
    ? parseResult.resolved.length + parseResult.ambiguous.length + parseResult.unresolved.length
    : 0;

  const handleCancel = useCallback(() => {
    cancel();
    onClose();
  }, [cancel, onClose]);

  const handleMinimize = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleGoToReview = useCallback(() => {
    goToReview();
    onClose();
  }, [goToReview, onClose]);

  // If the user confirms commit elsewhere (parseResult cleared) while modal is open, close.
  useEffect(() => {
    if (isExpanded && state === 'idle' && !inputText) {
      // nothing to do — stay open at idle
    }
  }, [isExpanded, state, inputText]);

  const readOnly = state === 'loading' || state === 'ready';

  return (
    <ModalByLabel
      position="absolute"
      isExpanded={isExpanded}
      content={
        <ModalShell>
          <ModalShell.Body>
            <ModalShell.Title>
              {state === 'idle' && 'Опишите, что вы ели'}
              {state === 'loading' && 'Обрабатываем…'}
              {state === 'ready' && `Готово · ${readyCount} ${pluralizeItems(readyCount)}`}
              {state === 'error' && 'Не получилось'}
            </ModalShell.Title>

            <div className={styles.textareaWrap}>
              <Textarea
                id={inputId}
                value={inputText}
                onChange={setInputText}
                placeholder={placeholder || DEFAULT_PLACEHOLDER}
                rows={6}
                maxLength={2000}
                readOnly={readOnly}
              />
              {state === 'loading' && (
                <div className={styles.loadingOverlay}>
                  <Spinner size={32} />
                  <p className={styles.loadingText}>Обрабатываем… (это займёт ~20–30 сек)</p>
                  <p className={styles.loadingHint}>Можно свернуть — мы закончим в фоне.</p>
                </div>
              )}
            </div>

            {state === 'error' && errorMessage && (
              <div className={styles.error}>{errorMessage}</div>
            )}

            {state === 'idle' && !online && (
              <div className={styles.offlineNotice}>
                Нет интернета. Подключитесь, чтобы обработать текст.
              </div>
            )}

            <ModalShell.ActionButtons
              debugId="write-food"
              left={
                state === 'loading' ? (
                  <ModalPrevButton onClick={handleMinimize} />
                ) : (
                  <ModalPrevButton onClick={handleCancel} />
                )
              }
              right={
                state === 'idle' ? (
                  <ModalNextButton onClick={() => submit(inputText)} label="Отправить" />
                ) : state === 'loading' ? (
                  <ModalNextButton onClick={() => {}} label="Ожидаем…" />
                ) : state === 'ready' ? (
                  <ModalNextButton onClick={handleGoToReview} label="К проверке" variant="finish" />
                ) : (
                  <ModalNextButton onClick={retry} label="Повторить" />
                )
              }
            />
          </ModalShell.Body>
        </ModalShell>
      }
    />
  );
};

function pluralizeItems(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'позиция';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'позиции';
  return 'позиций';
}

export default WriteFoodModal;
