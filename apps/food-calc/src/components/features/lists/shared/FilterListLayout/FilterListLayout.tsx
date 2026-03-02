import { observer } from 'mobx-react-lite';
import styles from './FilterListLayout.module.scss';

type Props = {
  headerContent?: React.ReactNode;
  filterPanel?: React.ReactNode;
  searchPanel?: React.ReactNode;
  searchPanelTitle?: string;
  mainContent?: React.ReactNode;
  bottomActionsPanel?: React.ReactNode;
};

const FilterListLayout = ({
  headerContent,
  filterPanel,
  searchPanel,
  searchPanelTitle,
  mainContent,
  bottomActionsPanel,
}: Props) => {
  return (
    <section className={styles.container}>
      <header className={styles.header}>{headerContent}</header>
      <div className={styles.content}>
        {filterPanel && <div className={styles.filters}>{filterPanel}</div>}
        {searchPanel && (
          <div className={styles.search} data-text={searchPanelTitle}>
            {searchPanel}
          </div>
        )}
        {mainContent}
        {bottomActionsPanel && (
          <div className={styles.bottomActionsPanel}>{bottomActionsPanel}</div>
        )}
      </div>
    </section>
  );
};

export default observer(FilterListLayout);
