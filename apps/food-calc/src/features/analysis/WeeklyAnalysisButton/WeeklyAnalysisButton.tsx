import { useNavigate } from 'react-router-dom';
import { QuietActionButton } from '@/shared/ui/atoms/Button/QuietActionButton';
import DaysIcon from '@/shared/assets/icons/days.svg?react';

// `/analyses` route — kept as a literal so this feature does not import from the
// `app` layer (FSD upward-import boundary). Mirrors AnalysisKindDrawer.
const ANALYSES_ROUTE = '/analyses';

/**
 * Top-left header action on the Analysis screen: «По неделям» → the long-analysis
 * page (list + hypotheses editor; «+ Анализ» opens CreateLongAnalysisDrawer).
 * Daily review now lives in the bottom write-bar; weekly moved here (2026-06-09).
 */
export const WeeklyAnalysisButton = () => {
  const navigate = useNavigate();
  return (
    <QuietActionButton
      label="По неделям"
      icon={<DaysIcon width={16} height={16} />}
      iconPosition="start"
      onClick={() => navigate(ANALYSES_ROUTE)}
    />
  );
};

export default WeeklyAnalysisButton;
