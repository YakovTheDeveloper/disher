import { observer } from 'mobx-react-lite';
import styles from './productBuilderPage.module.scss';
import { ProductBuilder } from '@/components/blocks/builders/food/ProductBuilder';
type Props = {
  children: React.ReactNode;
};

const productBuilderPage = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <ProductBuilder />
    </div>
  );
};

export default observer(productBuilderPage);
