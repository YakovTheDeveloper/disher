import { observer } from 'mobx-react-lite';
import styles from './DishFoodSelectionActions.module.scss';
type Props = {
  children?: React.ReactNode;
};

const DishFoodSelectionActions = ({ children }: Props) => {
  const onCopyDishItemsToScheduleButtonClick = () => {
    // TODO: move to new modal system
  };

  const onCopyToAnotherDishButtonClick = () => {
    // TODO: move to new modal system
  };

  return (
    <>
      <button onClick={onCopyDishItemsToScheduleButtonClick}>move/copy</button>
      <button onClick={onCopyToAnotherDishButtonClick}>в блюдо</button>
    </>
  );
};

export default observer(DishFoodSelectionActions);
