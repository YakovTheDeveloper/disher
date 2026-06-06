// Dev-only bug-report tool. Triggered by a long-press on the DesignVariantsBar
// trigger (dev / ?dv=1 only). Captures the current screen + route + UA/PWA, lets
// the dev type a note, and POSTs to /api/bug-reports (one JSON file + sibling
// screenshot per report). Spec: apps/food-calc/tds/bug-report-devtool.md.
export { openBugReport } from './model/openBugReport';
export type { BugReportPayload } from './api/submitBugReport';
