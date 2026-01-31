import { observer } from 'mobx-react-lite';
import styles from './ModalCreateDishFromSchedule.module.scss';
import { domainStore } from '@/store/store';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { useNavigate, useParams } from 'react-router';
import { useState } from 'react';
import { RouterLinks } from '@/router';

type Props = {
  modalStore: ModalStoreInstance;
};

const ModalCreateDishFromSchedule = ({ modalStore }: Props) => {
  const { date } = useParams();
  const navigate = useNavigate();

  if (!date) return null;

  const schedule = domainStore.scheduleStore.data.get(date);

  if (!schedule) return null;

  const selectedIds = domainStore.interactionsService.interactionsSelect.selectedIds;
  const selectedScheduleItems = schedule.foods.getChildrenByIds(selectedIds);

  const [removeScheduleItems, setReplaceItemsIfSameTime] = useState(false);
  const [time, setTime] = useState(selectedScheduleItems[0]?.time || '12:00');

  const onConfirm = () => {
    const dish = domainStore.interactionsService.createNewDishAndAppendToSchedule({
      schedule,
      timeToAddDishScheduleItem: time,
      removeScheduleItems,
    });
    if (!dish) return;
    navigate(RouterLinks.DishBuilder + '/' + dish.id);
    modalStore.closeModal();
  };

  return (
    <div className={styles.content}>
      <h2>Создать блюдо</h2>
      <label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <span>В какое время добавить блюдо</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={removeScheduleItems}
          onChange={(e) => setReplaceItemsIfSameTime(e.target.checked)}
        />
        <span>Удалить продукты после добавления блюда?</span>
      </label>
      <div className={styles.actions}>
        <button onClick={modalStore.closeModal} className={styles.cancel}>
          Отменить
        </button>
        <button onClick={onConfirm} className={styles.confirm}>
          Подтвердить
        </button>
      </div>
    </div>
  );
};

export default observer(ModalCreateDishFromSchedule);
