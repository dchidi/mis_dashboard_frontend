import {
  FaFileLines,
  FaPercent,
  FaSackDollar,
} from "react-icons/fa6";
import { formatCount, formatPercent } from "./helpers";
import type { QuoteCardTabConfig, TrendSeriesOption } from "./types";

export type MetricViewVariant = "quote" | "policy";

export const quoteCardTabs: QuoteCardTabConfig[] = [
  {
    key: "quote-trend",
    label: "Quote Trend",
    subtitle: "Monthly quotes, sales, and conversion performance.",
    title: "Quote Trend",
  },
  {
    key: "conversion-trend",
    label: "Conversion Trend",
    subtitle: "Monthly conversion rate movement versus prior year.",
    title: "Conversion Trend",
  },
  {
    key: "brand-contribution",
    label: "Brand Contribution",
    subtitle: "Quote volume and contribution across active brands.",
    title: "Brand Contribution",
  },
  {
    key: "pet-type-mix",
    label: "Pet Type Mix",
    subtitle: "Distribution of quotes by pet category.",
    title: "Pet Type Mix",
  },
];

const quoteTrendSeriesOptions: TrendSeriesOption[] = [
  {
    accentRgb: "138, 116, 232",
    color: "#8a74e8",
    description: "Quote volume",
    icon: FaFileLines,
    key: "totalQuote",
    label: "Total Quote",
    previousYearKey: "previousYearTotalQuote",
    valueFormatter: formatCount,
  },
  {
    accentRgb: "51, 177, 139",
    color: "#33b18b",
    description: "Sales volume",
    icon: FaSackDollar,
    key: "totalSales",
    label: "Total Sales",
    previousYearKey: "previousYearTotalSales",
    valueFormatter: formatCount,
  },
  {
    accentRgb: "78, 141, 245",
    color: "#4e8df5",
    description: "Conversion rate",
    icon: FaPercent,
    key: "conversionRate",
    label: "Conversion %",
    previousYearKey: "previousYearConversionRate",
    valueFormatter: formatPercent,
  },
];

const policyTrendSeriesOptions: TrendSeriesOption[] = [
  {
    accentRgb: "90, 196, 171",
    color: "#5ac4ab",
    description: "Policy volume",
    icon: FaFileLines,
    key: "totalQuote",
    label: "Total Policy",
    previousYearKey: "previousYearTotalQuote",
    valueFormatter: formatCount,
  },
  {
    accentRgb: "213, 150, 88",
    color: "#d59658",
    description: "Sales volume",
    icon: FaSackDollar,
    key: "totalSales",
    label: "Total Sales",
    previousYearKey: "previousYearTotalSales",
    valueFormatter: formatCount,
  },
  {
    accentRgb: "123, 132, 247",
    color: "#7b84f7",
    description: "Conversion rate",
    icon: FaPercent,
    key: "conversionRate",
    label: "Conversion %",
    previousYearKey: "previousYearConversionRate",
    valueFormatter: formatPercent,
  },
];

export const getTrendSeriesOptions = (
  variant: MetricViewVariant = "quote",
): TrendSeriesOption[] =>
  variant === "policy" ? policyTrendSeriesOptions : quoteTrendSeriesOptions;

export const trendSeriesOptions = getTrendSeriesOptions("quote");
