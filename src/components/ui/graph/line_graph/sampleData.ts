import type { LineGraphDatum, LineSeriesConfig } from "./BaseLineGraph";

export const attritionTrendSampleData: LineGraphDatum[] = [
  { month: "Jan", overall: 2.1, voluntary: 1.4, involuntary: 0.7 },
  { month: "Feb", overall: 2.4, voluntary: 1.6, involuntary: 0.8 },
  { month: "Mar", overall: 2.2, voluntary: 1.5, involuntary: 0.7 },
  { month: "Apr", overall: 2.8, voluntary: 1.9, involuntary: 0.9 },
  { month: "May", overall: 2.6, voluntary: 1.8, involuntary: 0.8 },
  { month: "Jun", overall: 2.3, voluntary: 1.5, involuntary: 0.8 },
];

export const attritionTrendSampleLines: [
  LineSeriesConfig,
  LineSeriesConfig,
  LineSeriesConfig,
] = [
  { color: "var(--accent)", dataKey: "overall", name: "Overall" },
  { color: "#14b8a6", dataKey: "voluntary", name: "Voluntary" },
  { color: "#f59e0b", dataKey: "involuntary", name: "Involuntary" },
];

export const retentionRateSampleData: LineGraphDatum[] = [
  { month: "Jan", retentionRate: 86.1 },
  { month: "Feb", retentionRate: 85.4 },
  { month: "Mar", retentionRate: 86.8 },
  { month: "Apr", retentionRate: 87.2 },
  { month: "May", retentionRate: 86.9 },
  { month: "Jun", retentionRate: 87.5 },
];

export const retentionRateSampleLine: LineSeriesConfig = {
  color: "#14b8a6",
  dataKey: "retentionRate",
  name: "Retention Rate",
};
