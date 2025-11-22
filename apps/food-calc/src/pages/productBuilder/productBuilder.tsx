import { observer } from "mobx-react-lite";
                    import styles from './productBuilder.module.scss'
type Props = {
  children: React.ReactNode;
}

const productBuilder = ({ children }: Props) => {
  return (
    <div className={styles.container}>productBuilder</div>
  )
}

export default observer(productBuilder);
