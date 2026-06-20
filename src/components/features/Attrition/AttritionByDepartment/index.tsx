import { formatCount, formatPercent } from "../../../../utils/formatters";
import { productPerformanceData } from "../data";
import { getMetricViewDescriptor } from "../metricView";
import ProductRankingCard, {
  type ProductRankingRow,
} from "../ProductRankingCard";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";

interface ProductVolumeCardProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
}

const AttritionByDepartment: React.FC<ProductVolumeCardProps> = ({
  activeTrendSeriesKey,
  className,
}) => {
  const metricDescriptor = getMetricViewDescriptor(activeTrendSeriesKey);
  const totalQuotedVolume = productPerformanceData.reduce(
    (sum, row) => sum + row.quotedVolume,
    0,
  );
  const totalConvertedVolume = productPerformanceData.reduce(
    (sum, row) => sum + row.convertedVolume,
    0,
  );
  const summaryValue =
    activeTrendSeriesKey === "totalQuote"
      ? formatCount(totalQuotedVolume)
      : activeTrendSeriesKey === "totalSales"
        ? formatCount(totalConvertedVolume)
        : formatPercent(
            Number(
              (
                (totalConvertedVolume / Math.max(totalQuotedVolume, 1)) *
                100
              ).toFixed(1),
            ),
          );
  const metricTotal =
    activeTrendSeriesKey === "totalQuote"
      ? totalQuotedVolume
      : totalConvertedVolume;
  const rows: ProductRankingRow[] = productPerformanceData
    .map((row) => {
      if (activeTrendSeriesKey === "conversionRate") {
        const conversionRate = Number(
          ((row.convertedVolume / Math.max(row.quotedVolume, 1)) * 100).toFixed(1),
        );

        return {
          metaDisplay: `${formatCount(row.convertedVolume)} / ${formatCount(row.quotedVolume)}`,
          metricDisplay: formatPercent(conversionRate),
          metricValue: conversionRate,
          product: row.product,
        };
      }

      const metricValue =
        activeTrendSeriesKey === "totalSales"
          ? row.convertedVolume
          : row.quotedVolume;
      const share = Number(
        ((metricValue / Math.max(metricTotal, 1)) * 100).toFixed(1),
      );

      return {
        metaDisplay: `${share}%`,
        metricDisplay: formatCount(metricValue),
        metricValue,
        product: row.product,
      };
    })
    .sort((left, right) => right.metricValue - left.metricValue)
    .slice(0, 5);

  return (
    <ProductRankingCard
      accentRgb="138, 116, 232"
      className={className}
      rows={rows}
      summaryLabel={metricDescriptor.productVolumeSummaryLabel}
      summaryValue={summaryValue}
      title={metricDescriptor.productVolumeTitle}
    />
  );
};

export default AttritionByDepartment;
