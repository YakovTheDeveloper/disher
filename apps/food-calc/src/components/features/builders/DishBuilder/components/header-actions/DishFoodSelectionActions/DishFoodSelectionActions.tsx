import { observer } from 'mobx-react-lite';
import './DishFoodSelectionActions.module.scss';

const DishFoodSelectionActions = () => {
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
