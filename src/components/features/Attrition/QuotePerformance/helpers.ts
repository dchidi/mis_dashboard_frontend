import type { QuoteTrendDatum } from "../data";
import {
  formatAxisCount,
  formatCount,
  formatPercent,
} from "../../../../utils/formatters";
import type { TrendSeriesKey, TrendSeriesPreviousYearKey } from "./types";

export const joinClassNames = (
  ...classNames: Array<string | false | undefined>
) => classNames.filter(Boolean).join(" ");

export { formatAxisCount, formatCount, formatPercent };

export const formatDeltaPercent = (value: number) =>
  `${Math.abs(Number(value.toFixed(1)))}%`;

export const formatPointGap = (value: number) =>
  `${Math.abs(Number(value.toFixed(1)))} pts`;

export const readTrendMetric = (
  datum: QuoteTrendDatum,
  key: TrendSeriesKey | TrendSeriesPreviousYearKey,
) => {
  const value = datum[key];
  return typeof value === "number" ? value : 0;
};
