import type { IconType } from "react-icons";

export type QuoteCardTabKey =
  | "quote-trend"
  | "cumulative-trend"
  | "conversion-trend"
  | "brand-contribution"
  | "pet-type-mix";

export interface QuoteCardTabConfig {
  key: QuoteCardTabKey;
  label: string;
  subtitle: string;
  title: string;
}

export type TrendSeriesKey = "totalQuote" | "totalSales" | "conversionRate";

export type TrendSeriesPreviousYearKey =
  | "previousYearTotalQuote"
  | "previousYearTotalSales"
  | "previousYearConversionRate";

export interface KeyAlert {
  id: string;
  severity: "high" | "medium" | "low";
  text: string;
  tone: "risk" | "trend" | "exception";
}

export interface TrendSeriesOption {
  accentRgb: string;
  color: string;
  description: string;
  icon: IconType;
  key: TrendSeriesKey;
  label: string;
  previousYearKey: TrendSeriesPreviousYearKey;
  valueFormatter: (value: number) => string;
}

export type Direction = "up" | "down" | "flat";
export type Tone = "positive" | "negative" | "neutral" | "warm" | "cool";

export interface AnalysisContent {
  activeAnalysisAlerts: KeyAlert[];
  activeAnalysisSummary: string[];
  analysisSpotlightLabel: string;
  analysisSpotlightMeta: string;
  analysisSpotlightTone: Tone;
  analysisSpotlightValue: string;
  insightAccentRgb: string;
}
