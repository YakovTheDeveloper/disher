import styles from './ProductListPage.module.scss';
type Props = {
  children?: React.ReactNode;
};

const ProductListPage = ({}: Props) => {
  return <div className={styles.container}>ProductListPage</div>;
};

export default ProductListPage;
