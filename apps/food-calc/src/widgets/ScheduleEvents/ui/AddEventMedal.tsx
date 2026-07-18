import { RoundButton } from '@/shared/ui/RoundButton';
import addEventIcon from '@/shared/assets/icons/add-event-icon.png';
import { EVENT_CREATE_MAIN_INPUT_ID } from './EventCreateModal.constants';
import s from './AddEventMedal.module.scss';

/**
 * Медаль «Новое событие» в trailingSlot бара событий — вход в ОФЛАЙН-форму
 * (`ModalByLabel` через `htmlFor` → фокус `EVENT_CREATE_MAIN_INPUT_ID`). Облик =
 * flat-медаль «Список еды» (FoodWriteBar): плашка-подложка + бордер-кольцо, подпись
 * на НИЖНЕЙ дуге (`arcBottom`, под картинкой), а не на верхней. Art-специфичная
 * посадка иконки крупнее + сдвиг вверх (`imgWidth`/`imgNudgeY`). Картинка
 * (add-event-icon.png) — чёрная линия на белом → base multiply роняет белый фон.
 */
export const AddEventMedal = () => (
  <div className={s.wrap}>
    <RoundButton
      htmlFor={EVENT_CREATE_MAIN_INPUT_ID}
      ariaLabel="Новое событие"
      img={addEventIcon}
      imgWidth="120%"
      imgNudgeX="-15px"
      imgNudgeY="-20px"
      arcBottom="Новое событие"
      floating={false}
      look="flat"
    />
  </div>
);

export default AddEventMedal;
