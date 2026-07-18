import { ModalShell } from '@/shared/ui/ModalShell';
import { ModalNextButton } from '@/shared/ui/ModalFooter';
import { ActionList } from '@/shared/ui/ActionList';
import { ScaleSlider } from '@/shared/ui/ScaleSlider';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import { Numeral } from '@/shared/ui/atoms/Typography';
import { EVENT_CREATE_MAIN_INPUT_ID, ASPECT_PLACEHOLDERS } from './EventCreateModal.constants';
import s from './EventCreateModal.module.scss';

export interface AspectDraft {
  label: string;
  value: number;
}

type Props = {
  text: string;
  onTextChange: (value: string) => void;
  aspects: AspectDraft[];
  onAspectChange: (index: number, patch: Partial<AspectDraft>) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  onClose: () => void;
};

/**
 * «Новое событие» — офлайн-форма события: свободное описание состояния + ровно 4
 * «оценочных варианта» (label + линейка 0..10). Каркас — `ActionList` (две секции),
 * каждый вариант = поле имени + `ScaleSlider`. Коммит (`onSubmit`) собирает только
 * варианты с непустым label; см. EventsWriteBar. Тело для `ModalByLabel` — оборачиваем
 * в `ModalShell` напрямую (не через ModalLayout, как и весь label-driven путь).
 */
const EventCreateModal = ({
  text,
  onTextChange,
  aspects,
  onAspectChange,
  canSubmit,
  onSubmit,
  onClose,
}: Props) => (
  <ModalShell>
    <ModalShell.Header title="Новое событие" onBack={onClose} />
    <ModalShell.Body>
      <ActionList>
        <ActionList.Section label="Опишите своё состояние">
          <AutoGrowSearch
            id={EVENT_CREATE_MAIN_INPUT_ID}
            value={text}
            onChange={onTextChange}
            placeholder="Что происходит, как вы себя чувствуете…"
            minRows={2}
          />
        </ActionList.Section>

        <ActionList.Section label="Оценочные варианты">
          {aspects.map((aspect, index) => (
            <div key={index} className={s.aspect}>
              <div className={s.head}>
                <AutoGrowSearch
                  singleLine
                  className={s.label}
                  value={aspect.label}
                  onChange={(v) => onAspectChange(index, { label: v })}
                  placeholder={ASPECT_PLACEHOLDERS[index] ?? 'Оценочный вариант'}
                />
                <Numeral as="output" size="lg" weight="bold" className={s.value}>
                  {aspect.value}
                </Numeral>
              </div>
              <ScaleSlider
                hideValue
                value={aspect.value}
                onChange={(v) => onAspectChange(index, { value: v })}
                ariaLabel={aspect.label.trim() || `Оценочный вариант ${index + 1}, 0–10`}
              />
            </div>
          ))}
        </ActionList.Section>
      </ActionList>

      <ModalShell.ActionButtons
        right={<ModalNextButton onClick={onSubmit} variant="finish" disabled={!canSubmit} />}
      />
      <ModalShell.Spacer />
    </ModalShell.Body>
  </ModalShell>
);

export default EventCreateModal;
