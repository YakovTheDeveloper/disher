export interface DailyAnalysisResponse {
  content: string;
  inputHash: string;
  date: string;
  tab: string;
  createdAt: string;
}

export interface DailyAnalysisCachedResponse {
  content: string;
  inputHash: string;
  cached: true;
}

export interface WeeklyAnalysisResponse {
  content: string;
  dailyHashes: string[];
  weekStart: string;
  createdAt: string;
}

export type AnalyticsTab = "food" | "day" | "week";
