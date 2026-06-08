import { memo, useState } from 'react';
import { toast } from 'sonner';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { saveHypothesis } from '@/entities/hypothesis';
import styles from './HypothesisComposer.module.scss';

type Props = {
  /** Called after a successful saveHypothesis with the new id. */
  onCreated: (id: string) => void;
  /**
   * Id поля ввода. Нужен, когда модалку открывают по ModalByLabel-идиоме:
   * внешний `<label htmlFor>` (кнопка «Гипотезы» в нижнем баре) фокусит это
   * поле → onFocusCapture раскрывает модалку и курсор сразу в композере.
   */
  inputId?: string;
};

// Inline create surface at the top of the hypothesis section: heading, a
// single-line title field, and a «Добавить» button below. Title-only — the
// body is added later via EditHypothesisModal (tap on a row). Enter submits
// and keeps focus in the field (a series is entered with Enter); the button
// submits and loses focus — that is accepted, we do not refocus explicitly.
const HypothesisComposer = ({ onCreated, inputId }: Props) => {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Collapse any pasted newlines into spaces — singleLine AutoGrowSearch does
  // not strip them (known issue), so the title could carry hidden `\n`.
  const clean = title.replace(/\s+/g, ' ').trim();
  const canSubmit = clean.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const id = await saveHypothesis({ title: clean, body: '' });
      toast.success('Гипотеза добавлена');
      onCreated(id);
      setTitle('');
    } catch (err) {
      console.error('saveHypothesis failed', err);
      toast.error('Не удалось сохранить');
      // title НЕ чистим — не теряем уже введённый юзером текст.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.composer}>
      <AutoGrowSearch
        id={inputId}
        singleLine
        value={title}
        onChange={setTitle}
        onSubmit={handleSubmit}
        placeholder="Головная боль после молочки"
        maxLength={500}
      />
      <button
        type="button"
        className={styles.submit}
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        Добавить
      </button>
    </section>
  );
};

export default memo(HypothesisComposer);
