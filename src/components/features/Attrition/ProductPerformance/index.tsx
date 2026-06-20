import { useState, type CSSProperties } from "react";
import {
  formatCompactCurrency,
  formatCount,
  formatPercent,
} from "../../../../utils/formatters";
import Card from "../../../ui/card/Card";
import SegmentedTabs from "../../../ui/segmented_tabs";
import { productPerformanceData } from "../data";
import { getMetricViewDescriptor } from "../metricView";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";
import style from "./ProductPerformance.module.css";

type ProductMetricTabKey = "value" | "volume";

interface ProductPerformanceProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
}

interface ProductRow {
  contributionValue: number;
  metaDisplay: string;
  metricDisplay: string;
  metricValue: number;
  product: string;
}

const formatCurrency = (value: number) =>
  formatCompactCurrency(value, { currencySymbol: "\u00A3" });

const productMetricTabs = [
  { key: "volume" as const, label: "Volume" },
  { key: "value" as const, label: "Value" },
];

const ProductPerformance: React.FC<ProductPerformanceProps> = ({
  activeTrendSeriesKey,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<ProductMetricTabKey>("volume");
  const metricDescriptor = getMetricViewDescriptor(activeTrendSeriesKey);
  const isVolumeTab = activeTab === "volume";
  const accentRgb = isVolumeTab ? "78, 141, 245" : "212, 117, 88";
  const totalQuotedMetric = productPerformanceData.reduce(
    (sum, row) => sum + (isVolumeTab ? row.quotedVolume : row.quotedValue),
    0,
  );
  const totalConvertedMetric = productPerformanceData.reduce(
    (sum, row) => sum + (isVolumeTab ? row.convertedVolume : row.convertedValue),
    0,
  );
  const title = isVolumeTab
    ? metricDescriptor.productVolumeTitle
    : metricDescriptor.productValueTitle;
  const metricTotal =
    activeTrendSeriesKey === "totalSales" ? totalConvertedMetric : totalQuotedMetric;
  const rows: ProductRow[] = productPerformanceData
    .map((row) => {
      const quotedMetric = isVolumeTab ? row.quotedVolume : row.quotedValue;
      const convertedMetric = isVolumeTab ? row.convertedVolume : row.convertedValue;

      if (activeTrendSeriesKey === "conversionRate") {
        const conversionRate = Number(
          ((convertedMetric / Math.max(quotedMetric, 1)) * 100).toFixed(1),
        );

        return {
          contributionValue: convertedMetric,
          metaDisplay: isVolumeTab
            ? `${formatCount(row.convertedVolume)} / ${formatCount(row.quotedVolume)}`
            : `${formatCurrency(row.convertedValue)} / ${formatCurrency(row.quotedValue)}`,
          metricDisplay: formatPercent(conversionRate),
          metricValue: conversionRate,
          product: row.product,
        };
      }

      const metricValue =
        activeTrendSeriesKey === "totalSales" ? convertedMetric : quotedMetric;
      const share = Number(
        ((metricValue / Math.max(metricTotal, 1)) * 100).toFixed(1),
      );

      return {
        contributionValue: metricValue,
        metaDisplay: `${share}%`,
        metricDisplay: isVolumeTab
          ? formatCount(metricValue)
          : formatCurrency(metricValue),
        metricValue,
        product: row.product,
      };
    })
    .sort((left, right) => right.metricValue - left.metricValue)
    .slice(0, 5);
  const contributionTotal =
    activeTrendSeriesKey === "totalQuote" ? totalQuotedMetric : totalConvertedMetric;
  const topFiveShare = Number(
    (
      (rows.reduce((sum, row) => sum + row.contributionValue, 0) /
        Math.max(contributionTotal, 1)) *
      100
    ).toFixed(1),
  );
  const maxValue = rows.reduce(
    (currentMax, row) => Math.max(currentMax, row.metricValue),
    0,
  );
  const rootStyle = {
    "--accent-rgb": accentRgb,
  } as CSSProperties;

  return (
    <Card className={className}>
      <div className={style.root} style={rootStyle}>
        <div className={style.header}>
          <div className="cardTitle">{title}</div>

          <div className={style.summary}>
            <span className={style.summaryLabel}>Top 5 Share</span>
            <strong className={style.summaryValue}>
              {formatPercent(topFiveShare)}
            </strong>
          </div>
        </div>

        <SegmentedTabs
          accentRgb={accentRgb}
          activeKey={activeTab}
          ariaLabel="Product ranking views"
          idBase="product-performance"
          onChange={setActiveTab}
          options={productMetricTabs}
        />

        <section
          aria-labelledby={`product-performance-tab-${activeTab}`}
          className={style.panelBody}
          id={`product-performance-panel-${activeTab}`}
          role="tabpanel"
        >
          <div className={style.panelContent}>
            <div className={style.list}>
              {rows.map((row, index) => {
                const fillWidth =
                  maxValue === 0 ? "0%" : `${(row.metricValue / maxValue) * 100}%`;

                return (
                  <div
                    className={style.row}
                    key={row.product}
                    title={`${row.product}: ${row.metricDisplay}`}
                  >
                    <div className={style.rowTop}>
                      <div className={style.identity}>
                        <span className={style.rank}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className={style.productName}>{row.product}</span>
                      </div>

                      <div className={style.metricGroup}>
                        <span className={style.metricValue}>
                          {row.metricDisplay}
                        </span>
                        <span className={style.metricMeta}>{row.metaDisplay}</span>
                      </div>
                    </div>

                    <div className={style.track}>
                      <span className={style.fill} style={{ width: fillWidth }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Card>
  );
};

export default ProductPerformance;
