import { observer } from 'mobx-react-lite';
import styles from './ScheduleFoodSelectionActions.module.scss';
type Props = {
  children?: React.ReactNode;
};

const ScheduleFoodSelectionActions = ({ children }: Props) => {
  const onCreateDishButtonClick = () => {
    // TODO: move to new modal system
  };

  const onCopyToAnotherDayButtonClick = () => {
    // TODO: move to new modal system
  };

  return (
    <>
      <button onClick={onCreateDishButtonClick}>создать новое блюдо</button>
      <button onClick={onCopyToAnotherDayButtonClick}>перенести еду в другой день</button>
    </>
  );
};

export default observer(ScheduleFoodSelectionActions);
