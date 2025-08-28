import { useEffect, useMemo, useRef } from "react";
import { ScheduleBuilderViewModel } from "./model/ScheduleBuilderViewModel";
import { observer } from "mobx-react-lite";
import style from "./ScheduleBuilder.module.scss";
import { ScheduleBuilderFoodSuggestions } from "./ScheduleBuilderFoodSuggestions";

const ScheduleBuilder = () => {
  const vm = useMemo(() => new ScheduleBuilderViewModel(), []);

  return (
    <div className={style.ScheduleBuilder}>
      <ul className={style.ScheduleBuilder__list}>
        {vm.schedule.items.map((schedule) => (
          <li
            key={schedule.id}
            className={style.ScheduleBuilder__listItem}
            onClick={() => vm.setCurrentScheduleItem(schedule)}
          >
            <p>{schedule.foodName}</p>
            <p>{schedule.quantity}</p>
            <p>{schedule.time}</p>
          </li>
        ))}
      </ul>
      <ScheduleBuilderFoodSuggestions
        currentScheduleItem={vm.currentScheduleItem}
        updateCurrentScheduleItem={vm.updateCurrentScheduleItem}
      />
      <button
        onClick={vm.createItem}
        className={style.ScheduleBuilder__addButton}
      >
        +
      </button>
    </div>
  );
};

export default observer(ScheduleBuilder);
