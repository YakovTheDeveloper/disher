import { observer } from 'mobx-react-lite';
import TextBehind from '@/components/ui/TextBehind/TextBehind';
import styles from './FilterListLayout.module.scss';

type Props = {
  filterPanel?: React.ReactNode;
  searchPanel?: React.ReactNode;
  searchPanelTitle?: string;
  mainContent?: React.ReactNode;
};

const FilterListLayout = ({ filterPanel, searchPanel, searchPanelTitle, mainContent }: Props) => {
  return (
    <div className={styles.content}>
      {searchPanel && <TextBehind text={searchPanelTitle}>{searchPanel}</TextBehind>}
      {filterPanel && <div className={styles.filters}>{filterPanel}</div>}
      {mainContent}
    </div>
  );
};

export default observer(FilterListLayout);
