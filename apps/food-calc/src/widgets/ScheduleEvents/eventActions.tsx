import type { ItemAction } from '@/features/shared/item-actions-drawer';
import { NoteIcon, ClockIcon, FeaturesIcon } from '@/features/shared/item-actions-drawer';
import { EDIT_MODAL_INPUT_IDS } from './ui/ScheduleEventEditModal.constants';

/**
 * Ряд правок дровера события = три круглые медали (тот же WriteBarMedal, что у
 * еды в расписании): дуговая подпись + иконка по центру. Порядок — Особенности ·
 * Описание · Время. У события нет detail-страницы, поэтому этот ряд заменяет
 * «Информация о…».
 *
 * Каждая медаль — `<label htmlFor>` на always-input edit-модалки: тап делегирует
 * фокус → её `onFocusCapture` флипает шаг и iOS поднимает клавиатуру (императивный
 * setStep её не поднимал). `prime` ТОЛЬКО праймит item (mount модалки без шага) —
 * НЕ закрывает дровер и НЕ сетит шаг: синхронный setStep/close размонтировал бы
 * label до делегирования (CLAUDE.md «Label focus delegation»). Дровер закрывается
 * сам, когда фокус уходит в модалку (её handleFocusCapture зовёт closeLast).
 */
export function buildEventEditActions(prime: () => void): ItemAction[] {
  return [
    {
      label: 'Особенности',
      icon: <FeaturesIcon />,
      htmlFor: EDIT_MODAL_INPUT_IDS.ATOMS_INPUT,
      onClick: prime,
    },
    {
      label: 'Описание',
      icon: <NoteIcon />,
      htmlFor: EDIT_MODAL_INPUT_IDS.TEXT_INPUT,
      onClick: prime,
    },
    {
      label: 'Время',
      icon: <ClockIcon />,
      htmlFor: EDIT_MODAL_INPUT_IDS.TIME_INPUT,
      onClick: prime,
    },
  ];
}
