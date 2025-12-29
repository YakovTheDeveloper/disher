import { observer } from "mobx-react-lite";
                    import styles from './ScheduleEventsEdit.module.scss'
type Props = {
  children: React.ReactNode;
}

const ScheduleEventsEdit = ({ children }: Props) => {
  return (
    <div className={styles.container}>ScheduleEventsEdit</div>
  )
}

export default observer(ScheduleEventsEdit);
