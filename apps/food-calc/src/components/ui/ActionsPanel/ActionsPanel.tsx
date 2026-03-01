import { observer } from "mobx-react-lite";
                    import styles from './ActionsPanel.module.scss'
type Props = {
  children: React.ReactNode;
}

const ActionsPanel = ({ children }: Props) => {
  return (
    <div className={styles.container}>ActionsPanel</div>
  )
}

export default observer(ActionsPanel);
