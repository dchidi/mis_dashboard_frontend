import {
  getTrendSeriesOptions,
  type MetricViewVariant,
} from "./QuotePerformance/config";
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

const metricViewDescriptors: Record<
  MetricViewVariant,
  Record<TrendSeriesKey, MetricViewDescriptor>
> = {
  policy: {
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
      buttonDescription: "View policy volume and value across connected cards",
      buttonLabel: "Policy",
      countryTitle: "Policy by Country",
      performanceTitle: "Policy Performance",
      productValueSummaryLabel: "Policy Value",
      productValueTitle: "Policy Value by Product (Top 5)",
      productVolumeSummaryLabel: "Policy Vol.",
      productVolumeTitle: "Policy Volume by Product (Top 5)",
      trendTabLabel: "Policy Trend",
    },
    totalSales: {
      buttonDescription: "View sales volume and value across connected cards",
      buttonLabel: "Sales",
      countryTitle: "Sales by Country",
      performanceTitle: "Sales Performance",
      productValueSummaryLabel: "Sales Value",
      productValueTitle: "Top 5 Products by Sales Value",
      productVolumeSummaryLabel: "Sales Vol.",
      productVolumeTitle: "Top 5 Products by Sales Volume",
      trendTabLabel: "Sales Trend",
    },
  },
  quote: {
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
      productValueTitle: "Quote Value by Product (Top 5)",
      productVolumeSummaryLabel: "Quoted Vol.",
      productVolumeTitle: "Quote Volume by Product (Top 5)",
      trendTabLabel: "Quote Trend",
    },
    totalSales: {
      buttonDescription: "View sales volume and value across connected cards",
      buttonLabel: "Sales",
      countryTitle: "Sales by Country",
      performanceTitle: "Sales Performance",
      productValueSummaryLabel: "Sales Value",
      productValueTitle: "Top 5 Products by Sales Value",
      productVolumeSummaryLabel: "Sales Vol.",
      productVolumeTitle: "Top 5 Products by Sales Volume",
      trendTabLabel: "Sales Trend",
    },
  },
};

export const getMetricViewDescriptor = (
  key: TrendSeriesKey,
  variant: MetricViewVariant = "quote",
) => metricViewDescriptors[variant][key];

export const getActiveTrendSeries = (
  key: TrendSeriesKey,
  variant: MetricViewVariant = "quote",
): TrendSeriesOption => {
  const trendSeriesOptions = getTrendSeriesOptions(variant);
  return (
    trendSeriesOptions.find((series) => series.key === key) ??
    trendSeriesOptions[0]
  );
};

export type { MetricViewVariant };
