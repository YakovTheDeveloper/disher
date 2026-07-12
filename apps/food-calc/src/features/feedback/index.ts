// User-facing bug report / feedback. A simplified single-field description modal
// (ModalByLabel) opened from the settings drawer, persisted to pg via the
// prod-safe /api/user-reports route. Distinct from the dev-only disk sink in
// features/dev/bug-report (screenshots + tabs, gated behind the DesignVariantsBar).
export { ReportProblemModal } from './ui/ReportProblemModal';
