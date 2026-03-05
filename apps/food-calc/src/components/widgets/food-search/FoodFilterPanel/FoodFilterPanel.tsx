import { observer } from "mobx-react-lite";
                    import styles from './FoodFilterPanel.module.scss'
type Props = {
  children: React.ReactNode;
}

const FoodFilterPanel = ({ children }: Props) => {
  return (
    <div className={styles.container}>FoodFilterPanel</div>
  )
}

export default observer(FoodFilterPanel);
