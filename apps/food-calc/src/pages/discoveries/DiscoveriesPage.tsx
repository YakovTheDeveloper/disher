import { memo } from 'react';
import DiscoveriesTopBar from './ui/DiscoveriesTopBar';
import DiscoveriesScreen from './ui/DiscoveriesScreen';
import styles from './DiscoveriesPage.module.scss';

// /discoveries — «Открытия»: зонтик над гипотезами (что я проверяю) и инсайтами
// (что нашла LLM на разборах). Заменяет бывшую фуллскрин-модалку «Гипотезы»,
// открывавшуюся с нижнего бара Home / Analyses (кнопка теперь «Открытия» и
// ведёт сюда). Обвязка — как у AnalysesPage: плавающий HomeTopBar поверх
// `.ambient`, лист Screen стартует под ним.
const DiscoveriesPage = () => {
  return (
    <div className={styles.ambient}>
      <DiscoveriesTopBar />
      <div className={styles.swipeArea}>
        <DiscoveriesScreen />
      </div>
    </div>
  );
};

export default memo(DiscoveriesPage);
