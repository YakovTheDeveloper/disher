import { observer } from "mobx-react-lite";
                    import styles from './ScheduleFoodContent.module.scss'
type Props = {
  children: React.ReactNode;
}

const ScheduleFoodContent = ({ children }: Props) => {
  return (
    <div className={styles.container}>ScheduleFoodContent</div>
  )
}

export default observer(ScheduleFoodContent);
