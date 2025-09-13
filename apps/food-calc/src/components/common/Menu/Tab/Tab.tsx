import { observer } from "mobx-react-lite";
                    import styles from './Tab.module.scss'
type Props = {
  children: React.ReactNode;
}

const Tab = ({ children }: Props) => {
  return (
    <div className={styles.container}>Tab</div>
  )
}

export default observer(Tab);
