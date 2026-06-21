import {
  FaFileLines,
  FaPercent,
  FaSackDollar,
} from "react-icons/fa6";
import { formatCount, formatPercent } from "./helpers";
import type { QuoteCardTabConfig, TrendSeriesOption } from "./types";

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

export const trendSeriesOptions: TrendSeriesOption[] = [
  {
    accentRgb: "138, 116, 232",
    key: "totalQuote",
    label: "Total Quote",
    description: "Quote volume",
    icon: FaFileLines,
    previousYearKey: "previousYearTotalQuote",
    color: "#8a74e8",
    valueFormatter: formatCount,
  },
  {
    accentRgb: "51, 177, 139",
    key: "totalSales",
    label: "Total Sales",
    description: "Sales volume",
    icon: FaSackDollar,
    previousYearKey: "previousYearTotalSales",
    color: "#33b18b",
    valueFormatter: formatCount,
  },
  {
    accentRgb: "78, 141, 245",
    key: "conversionRate",
    label: "Conversion %",
    description: "Conversion rate",
    icon: FaPercent,
    previousYearKey: "previousYearConversionRate",
    color: "#4e8df5",
    valueFormatter: formatPercent,
  },
];
