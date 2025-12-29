import { observer } from "mobx-react-lite";
                    import styles from './SchheduleEventList.module.scss'
type Props = {
  children: React.ReactNode;
}

const SchheduleEventList = ({ children }: Props) => {
  return (
    <div className={styles.container}>SchheduleEventList</div>
  )
}

export default observer(SchheduleEventList);
