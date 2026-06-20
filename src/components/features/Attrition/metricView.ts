import { trendSeriesOptions } from "./QuotePerformance/config";
import type { TrendSeriesKey, TrendSeriesOption } from "./QuotePerformance/types";

interface MetricViewDescriptor {
  buttonDescription: string;
  buttonLabel: string;
  countryTitle: string;
  performanceTitle: string;
  productValueSummaryLabel: string;
  productValueTitle: string;
  productVolumeSummaryLabel: string;
  productVolumeTitle: string;
  trendTabLabel: string;
}

const metricViewDescriptors: Record<TrendSeriesKey, MetricViewDescriptor> = {
  conversionRate: {
    buttonDescription: "View conversion rates across connected cards",
    buttonLabel: "Conversion",
    countryTitle: "Conversion by Country",
    performanceTitle: "Conversion Performance",
    productValueSummaryLabel: "Avg Value Conv.",
    productValueTitle: "Top 5 Products by Value Conversion",
    productVolumeSummaryLabel: "Avg Vol. Conv.",
    productVolumeTitle: "Top 5 Products by Volume Conversion",
    trendTabLabel: "Conversion Trend",
  },
  totalQuote: {
    buttonDescription: "View quoted volume and value across connected cards",
    buttonLabel: "Quoted",
    countryTitle: "Quote by Country",
    performanceTitle: "Quote Performance",
    productValueSummaryLabel: "Quoted Value",
    productValueTitle: "Top 5 Products by Quote Value",
    productVolumeSummaryLabel: "Quoted Vol.",
    productVolumeTitle: "Top 5 Products by Quote Volume",
    trendTabLabel: "Quote Trend",
  },
  totalSales: {
    buttonDescription: "View converted volume and value across connected cards",
    buttonLabel: "Converted",
    countryTitle: "Converted by Country",
    performanceTitle: "Converted Performance",
    productValueSummaryLabel: "Converted Value",
    productValueTitle: "Top 5 Products by Converted Value",
    productVolumeSummaryLabel: "Converted Vol.",
    productVolumeTitle: "Top 5 Products by Converted Volume",
    trendTabLabel: "Converted Trend",
  },
};

export const getMetricViewDescriptor = (key: TrendSeriesKey) =>
  metricViewDescriptors[key];

export const getActiveTrendSeries = (key: TrendSeriesKey): TrendSeriesOption =>
  trendSeriesOptions.find((series) => series.key === key) ?? trendSeriesOptions[0];
