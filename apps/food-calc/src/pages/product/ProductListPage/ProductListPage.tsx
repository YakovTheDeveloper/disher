import { observer } from "mobx-react-lite";
                    import styles from './ProductListPage.module.scss'
type Props = {
  children: React.ReactNode;
}

const ProductListPage = ({ children }: Props) => {
  return (
    <div className={styles.container}>ProductListPage</div>
  )
}

export default observer(ProductListPage);
