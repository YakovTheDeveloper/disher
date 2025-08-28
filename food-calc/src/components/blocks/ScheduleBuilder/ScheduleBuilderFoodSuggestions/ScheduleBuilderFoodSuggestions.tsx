import { observer } from "mobx-react-lite";
import { DayScheduleItemUI } from "../model/ScheduleBuilderViewModel";
import style from "./ScheduleBuilderFoodSuggestions.module.scss";
import { initProducts } from "@/store/productStore/initProducts";

type Props = {
  currentScheduleItem: DayScheduleItemUI | null;
  updateCurrentScheduleItem: (schedule: {
    quantity?: number;
    foodName?: string;
  }) => void;
};

const ScheduleBuilderFoodSuggestions = ({
  currentScheduleItem,
  updateCurrentScheduleItem,
}: Props) => {
  const variants = initProducts.filter(({ name }) => {
    return name
      .toLowerCase()
      .includes(currentScheduleItem?.foodName.toLowerCase());
  });

  const onChange = (e) => {
    updateCurrentScheduleItem({ foodName: e.target.value });
  };

  return (
    <div
      hidden={!currentScheduleItem}
      className={style.ScheduleBuilderFoodSuggestions}
    >
      <div>
        <ul className={style.ScheduleBuilderFoodSuggestions__list}>
          {variants.map(({ name }) => (
            <li>{name}</li>
          ))}
        </ul>
      </div>
      <input onChange={onChange}></input>
    </div>
  );
};

export default observer(ScheduleBuilderFoodSuggestions);
