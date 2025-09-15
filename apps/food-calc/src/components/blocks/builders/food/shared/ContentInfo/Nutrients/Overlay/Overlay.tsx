import { observer } from 'mobx-react-lite';
import styles from './Overlay.module.scss';
import { RequestState } from '@/api/RequestState';
import { isEmpty } from '@/lib/empty';
import { toJS } from 'mobx';
import clsx from 'clsx';
type Props = {
  loading: Record<string, Map<string, RequestState>>;
  currentId: {
    content: number[];
  };
  children: string;
};

const Overlay = ({ children, loading, currentId }: Props) => {
  const entries = Array.from(loading.getAllWithNutrients.keys());
  const atLeastOneFoodNutrientsMissing = entries.some((key) =>
    currentId.content.some((key2) => key === key2.toString())
  );

  return (
    <div className={clsx(styles.loader, atLeastOneFoodNutrientsMissing && styles.animate)}>
      {!atLeastOneFoodNutrientsMissing && children}
    </div>
  );
};

export default observer(Overlay);
