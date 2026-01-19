import { observer } from 'mobx-react-lite';
import styles from './ScalableHeaderNameInput.module.scss';
import SearchInput from '@/components/ui/Input/SearchInput/SearchInput';
import { Scalable } from '@/components/ui/Scalable';
import { MotionValue } from 'framer-motion';
import { FilteringState } from '@/components/features/shared/hooks/useFilteringState';
import { useScreenScroll } from '@/components/features/builders/food/shared/ui/layout/Screen/context/ScreenScrollContext';
type Props = {
  state: FilteringState;
};

const ScalableHeaderNameInput = ({ state }: Props) => {
  const scrollYProgress = useScreenScroll();
  return (
    <Scalable scrollYProgress={scrollYProgress} className={styles.header}>
      <SearchInput value={state.filterText} onChange={(e) => state.setSearch(e.target.value)} />
    </Scalable>
  );
};

export default observer(ScalableHeaderNameInput);
