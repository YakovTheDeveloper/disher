// Split out so ReportProblemModal.tsx stays component-only (a stray const export
// breaks React Fast Refresh → full reload). Feeds AutoGrowSearch's id.
export const REPORT_PROBLEM_INPUT_ID = 'report-problem-input';
