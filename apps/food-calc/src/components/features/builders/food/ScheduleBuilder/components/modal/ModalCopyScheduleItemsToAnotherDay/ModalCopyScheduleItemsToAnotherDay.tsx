import { observer } from 'mobx-react-lite';
import styles from './ModalCopyScheduleItemsToAnotherDay.module.scss';
import { ModalStoreInstance } from '@/store/GlobalUiStore/ModalStore/ModalStore';
import { ScheduleSelection } from '@/components/features/schedule/ScheduleSelection';
import { useState } from 'react';
import { domainStore } from '@/store/store';
import { useNavigate, useParams } from 'react-router';
import { RouterLinks } from '@/router';

type Props = {
  modalStore: ModalStoreInstance;
};

const ModalCopyScheduleItemsToAnotherDay = ({ modalStore }: Props) => {
  const { date } = useParams();
  const navigate = useNavigate();

  if (!date) return null;

  const schedule = domainStore.scheduleStore.data.get(date);

  if (!schedule) return null;

  const [dateTo, setDateTo] = useState('');
  const [action, setAction] = useState<'copy' | 'move'>('copy');
  const [shouldNavigateOnSuccess, setShouldNavigateOnSuccess] = useState(true);

  const onDaySelect = (date: string) => {
    setDateTo(date);
  };

  const onConfirm = () => {
    domainStore.interactionsService.moveOrCopyItemsFromOneScheduleToAnother(date, dateTo, action);
    modalStore.closeModal();
    if (shouldNavigateOnSuccess) {
      navigate(RouterLinks.ScheduleBuilder + '/' + dateTo);
    }
  };

  return (
    <div className={styles.content}>
      <header>
        Перенести данные на
        <span>{dateTo ? ` ${dateTo}` : ' указанный день'}</span>
      </header>

      <ScheduleSelection onSelect={onDaySelect} selectedDate={dateTo} />

      <label>
        <input
          type="checkbox"
          checked={action === 'copy'}
          onChange={(e) => setAction(e.target.checked ? 'copy' : 'move')}
        />
        <span>Скопировать</span>
      </label>
      <label>
        <input
          type="checkbox"
          checked={shouldNavigateOnSuccess}
          onChange={(e) => setShouldNavigateOnSuccess(e.target.checked)}
        />
        <span>Перейти к этому дню</span>
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

export default observer(ModalCopyScheduleItemsToAnotherDay);
