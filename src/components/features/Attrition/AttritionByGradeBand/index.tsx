import {
  formatCompactCurrency,
  formatPercent,
} from "../../../../utils/formatters";
import { productPerformanceData } from "../data";
import { getMetricViewDescriptor } from "../metricView";
import ProductRankingCard, {
  type ProductRankingRow,
} from "../ProductRankingCard";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";

const formatProductValue = (value: number) =>
  formatCompactCurrency(value, { currencySymbol: "\u00A3" });

interface ProductValueCardProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
}

const AttritionByGradeBand: React.FC<ProductValueCardProps> = ({
  activeTrendSeriesKey,
  className,
}) => {
  const metricDescriptor = getMetricViewDescriptor(activeTrendSeriesKey);
  const totalQuotedValue = productPerformanceData.reduce(
    (sum, row) => sum + row.quotedValue,
    0,
  );
  const totalConvertedValue = productPerformanceData.reduce(
    (sum, row) => sum + row.convertedValue,
    0,
  );
  const summaryValue =
    activeTrendSeriesKey === "totalQuote"
      ? formatProductValue(totalQuotedValue)
      : activeTrendSeriesKey === "totalSales"
        ? formatProductValue(totalConvertedValue)
        : formatPercent(
            Number(
              ((totalConvertedValue / Math.max(totalQuotedValue, 1)) * 100).toFixed(
                1,
              ),
            ),
          );
  const metricTotal =
    activeTrendSeriesKey === "totalQuote"
      ? totalQuotedValue
      : totalConvertedValue;
  const rows: ProductRankingRow[] = productPerformanceData
    .map((row) => {
      if (activeTrendSeriesKey === "conversionRate") {
        const conversionRate = Number(
          ((row.convertedValue / Math.max(row.quotedValue, 1)) * 100).toFixed(1),
        );

        return {
          metaDisplay: `${formatProductValue(row.convertedValue)} / ${formatProductValue(row.quotedValue)}`,
          metricDisplay: formatPercent(conversionRate),
          metricValue: conversionRate,
          product: row.product,
        };
      }

      const metricValue =
        activeTrendSeriesKey === "totalSales"
          ? row.convertedValue
          : row.quotedValue;
      const share = Number(
        ((metricValue / Math.max(metricTotal, 1)) * 100).toFixed(1),
      );

      return {
        metaDisplay: `${share}%`,
        metricDisplay: formatProductValue(metricValue),
        metricValue,
        product: row.product,
      };
    })
    .sort((left, right) => right.metricValue - left.metricValue)
    .slice(0, 5);

  return (
    <ProductRankingCard
      accentRgb="51, 177, 139"
      className={className}
      rows={rows}
      summaryLabel={metricDescriptor.productValueSummaryLabel}
      summaryValue={summaryValue}
      title={metricDescriptor.productValueTitle}
    />
  );
};

export default AttritionByGradeBand;
