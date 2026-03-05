import { observer } from "mobx-react-lite";
                    import styles from './EventSchedule.module.scss'
type Props = {
  children: React.ReactNode;
}

const EventSchedule = ({ children }: Props) => {
  return (
    <div className={styles.container}>EventSchedule</div>
  )
}

export default observer(EventSchedule);
