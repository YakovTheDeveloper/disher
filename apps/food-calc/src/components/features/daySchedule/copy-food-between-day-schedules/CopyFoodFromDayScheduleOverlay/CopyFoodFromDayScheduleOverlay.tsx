import { observer } from "mobx-react-lite";
                    import styles from './CopyFoodFromDayScheduleOverlay.module.scss'
type Props = {
  children: React.ReactNode;
}

const CopyFoodFromDayScheduleOverlay = ({ children }: Props) => {
  return (
    <div className={styles.container}>CopyFoodFromDayScheduleOverlay</div>
  )
}

export default observer(CopyFoodFromDayScheduleOverlay);
