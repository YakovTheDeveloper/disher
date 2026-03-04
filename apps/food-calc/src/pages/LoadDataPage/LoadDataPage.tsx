import { observer } from 'mobx-react-lite';
import styles from './LoadDataPage.module.scss';
import { domainStore } from '@/store/store';
import { useQuery } from '@tanstack/react-query';
type Props = {
  children?: React.ReactNode;
};

const LoadDataPage = ({}: Props) => {
  const currentLength = domainStore.foodStore.dataLength;
  const totalLength = domainStore.foodStore.total;

  const fetchFoodPage = async ({ pageParam = 1 }): Promise<Response> => {
    const res = await domainStore.foodStore.loadLazy({
      page: pageParam,
      limit: 10,
    });
    return res;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['all-food-data'],
    queryFn: fetchFoodPage,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return (
    <div className={styles.container}>
      <h1>Loading Application Data…</h1>
      {currentLength} / {totalLength}
      {isLoading && <div>Loading…</div>}
      {isError && <div>Error loading</div>}
      {data && <div>All data loaded</div>}
    </div>
  );
};

export default observer(LoadDataPage);
