import { observer } from "mobx-react-lite";
                    import styles from './MoveOrCopyToDaySchedule.module.scss'
type Props = {
  children: React.ReactNode;
}

const MoveOrCopyToDaySchedule = ({ children }: Props) => {
  return (
    <div className={styles.container}>MoveOrCopyToDaySchedule</div>
  )
}

export default observer(MoveOrCopyToDaySchedule);
