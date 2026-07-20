import SingleBarGraph, {
  type SingleBarGraphTooltipProps,
} from "../../../ui/graph/bar_chart/SingleBarGraph";
import SingleDonutChart, {
  type SingleDonutChartTooltipProps,
} from "../../../ui/graph/donut_chart/SingleDonutChart";
import ComparisonAreaGraph from "../../../ui/graph/area_graph/ComparisonAreaGraph";
import DoubleLineGraph from "../../../ui/graph/line_graph/DoubleLineGraph";
import {
  type BrandContributionDatum,
  type CumulativeTrendDatum,
  type PetTypeMixDatum,
  type QuoteMetricTableData,
  type QuoteTrendDatum,
} from "../data";
import {
  formatAxisCount,
  formatCount,
  formatPercent,
  joinClassNames,
} from "./helpers";
import QuoteMetrics from "./QuoteMetrics";
import PetTypeMixLegend from "./PetTypeMixLegend";
import TrendSeriesSelector from "./TrendSeriesSelector";
import type { TrendSeriesKey, TrendSeriesOption } from "./types";
import type { MetricViewVariant } from "../metricView";
import style from "./QuotePerformance.module.css";

interface QuoteTrendVisualProps {
  activeTrendSeries: TrendSeriesOption;
  activeTrendSeriesKey: TrendSeriesKey;
  expanded: boolean;
  metricsTableData: QuoteMetricTableData;
  onTrendSeriesChange: (key: TrendSeriesKey) => void;
  showSeriesSelector?: boolean;
  trendData: QuoteTrendDatum[];
}

export const QuoteTrendVisual: React.FC<QuoteTrendVisualProps> = ({
  activeTrendSeries,
  activeTrendSeriesKey,
  expanded,
  metricsTableData,
  onTrendSeriesChange,
  showSeriesSelector = true,
  trendData,
}) => {
  const quoteTrendChartColor =
    activeTrendSeriesKey === "totalQuote" ? "#c96a3d" : activeTrendSeries.color;

  return (
    <>
      {showSeriesSelector ? (
        <div className={style.trendSeriesRow}>
          <TrendSeriesSelector
            activeKey={activeTrendSeriesKey}
            onChange={onTrendSeriesChange}
          />
        </div>
      ) : null}
      <ComparisonAreaGraph
        allowYAxisDecimals={activeTrendSeriesKey === "conversionRate"}
        axisTickFormatter={(value) =>
          activeTrendSeriesKey === "conversionRate"
            ? formatPercent(value)
            : formatAxisCount(Math.round(value))
        }
        chartMargin={{ top: 8, right: 16, left: 10, bottom: 28 }}
        className={expanded ? style.analysisAreaChart : style.chart}
        comparisonDataKey={activeTrendSeries.previousYearKey}
        comparisonLabel="Previous Year"
        comparisonStrokeDasharray="6 5"
        currentDataKey={activeTrendSeries.key}
        currentLabel="Current Year"
        currentColor={quoteTrendChartColor}
        data={trendData}
        legendAlign="center"
        legendIconSize={8}
        legendVerticalAlign="bottom"
        legendWrapperStyle={{
          fontSize: "0.6rem",
          lineHeight: 1.1,
          paddingTop: 12,
        }}
        tooltipValueFormatter={(value) => activeTrendSeries.valueFormatter(value)}
        valueSuffix={activeTrendSeriesKey === "conversionRate" ? "%" : ""}
        xDataKey="month"
        xAxisPadding={{ left: 10, right: 10 }}
        yAxisWidth={activeTrendSeriesKey === "conversionRate" ? 56 : 48}
      />
      {expanded ? (
        <QuoteMetrics
          expanded
          tableData={metricsTableData}
        />
      ) : null}
    </>
  );
};

export const BrandContributionVisual: React.FC<{
  data?: BrandContributionDatum[];
  expanded: boolean;
  metricViewVariant?: MetricViewVariant;
}> = ({ data = [], expanded, metricViewVariant = "quote" }) => {
  const primaryMetricLabel =
    metricViewVariant === "policy" ? "Policy Volume" : "Quote Volume";

  const renderVariantTooltip = ({
    active,
    payload,
  }: SingleBarGraphTooltipProps) => {
    if (!active || !payload?.length) {
      return null;
    }

    const datum = payload[0].payload as BrandContributionDatum | undefined;
    if (!datum) {
      return null;
    }

    return (
      <div className={style.tooltip}>
        <div className={style.tooltipTitle}>{datum.brand}</div>
        <div className={style.tooltipRow}>
          <span>{primaryMetricLabel}</span>
          <strong>{formatCount(datum.quoteCount)}</strong>
        </div>
        <div className={style.tooltipRow}>
          <span>Contribution</span>
          <strong>{formatPercent(datum.share)}</strong>
        </div>
      </div>
    );
  };

  return (
    <SingleBarGraph
      barSize={22}
      categoryKey="brand"
      categoryWidth={148}
      className={joinClassNames(
        style.chart,
        style.brandChart,
        expanded && style.analysisBrandChart,
      )}
      color="#d47558"
      colorKey="fill"
      data={data}
      gridStroke="rgba(107, 99, 117, 0.18)"
      hideNumericAxis={false}
      numericTickFormatter={formatAxisCount}
      orientation="horizontal"
      renderTooltip={renderVariantTooltip}
      showTooltip
      valueKey="quoteCount"
    />
  );
};

export const ConversionTrendVisual: React.FC<{
  expanded: boolean;
  metricsTableData: QuoteMetricTableData;
  trendData: QuoteTrendDatum[];
}> = ({ expanded, metricsTableData, trendData }) => {
  return (
    <>
      <DoubleLineGraph
        chartMargin={{ top: 8, right: 16, left: 10, bottom: 28 }}
        className={expanded ? style.analysisAreaChart : style.chart}
        data={trendData}
        lines={[
          {
            color: "#6f8dff",
            dataKey: "conversionRate",
            name: "Current Year",
            strokeWidth: 3,
          },
          {
            color: "#7f879f",
            dataKey: "previousYearConversionRate",
            name: "Previous Year",
            strokeDasharray: "6 5",
            strokeWidth: 2.2,
          },
        ]}
        legendAlign="center"
        legendIconSize={8}
        legendVerticalAlign="bottom"
        legendWrapperStyle={{
          fontSize: "0.6rem",
          lineHeight: 1.1,
          paddingTop: 12,
        }}
        showDots
        showLegend
        valueSuffix="%"
        xDataKey="month"
        xAxisPadding={{ left: 10, right: 10 }}
        yAxisWidth={56}
      />
      {expanded ? <QuoteMetrics expanded tableData={metricsTableData} /> : null}
    </>
  );
};

export const CumulativeTrendVisual: React.FC<{
  expanded: boolean;
  metricsTableData: QuoteMetricTableData;
  trendData: CumulativeTrendDatum[];
  valueSuffix?: string;
  yAxisWidth?: number;
}> = ({
  expanded,
  metricsTableData,
  trendData,
  valueSuffix = "",
  yAxisWidth = 56,
}) => {
  return (
    <>
      <DoubleLineGraph
        chartMargin={{ top: 8, right: 16, left: 10, bottom: 28 }}
        className={expanded ? style.analysisAreaChart : style.chart}
        data={trendData}
        lines={[
          {
            color: "#5ac4ab",
            dataKey: "currentCumulative",
            name: "Current Year",
            strokeWidth: 3,
          },
          {
            color: "#9aa3bc",
            dataKey: "previousYearCumulative",
            name: "Previous Year",
            strokeDasharray: "6 5",
            strokeWidth: 2.2,
          },
        ]}
        legendAlign="center"
        legendIconSize={8}
        legendVerticalAlign="bottom"
        legendWrapperStyle={{
          fontSize: "0.6rem",
          lineHeight: 1.1,
          paddingTop: 12,
        }}
        showDots
        showLegend
        valueSuffix={valueSuffix}
        xDataKey="month"
        xAxisPadding={{ left: 10, right: 10 }}
        yAxisWidth={yAxisWidth}
      />
      {expanded ? <QuoteMetrics expanded tableData={metricsTableData} /> : null}
    </>
  );
};

export const PetTypeMixVisual: React.FC<{
  data?: PetTypeMixDatum[];
  expanded: boolean;
  metricViewVariant?: MetricViewVariant;
  totalQuote: number;
}> = ({
  data = [],
  expanded,
  metricViewVariant = "quote",
  totalQuote,
}) => {
  const centerLabel =
    metricViewVariant === "policy" ? "Total Policy" : "Total Quote";
  const tooltipMetricLabel =
    metricViewVariant === "policy" ? "Policies" : "Quotes";
  const alphabeticalData = [...data].sort((left, right) =>
    left.petType.localeCompare(right.petType, undefined, { sensitivity: "base" }),
  );
  const displayData =
    metricViewVariant === "quote" && !expanded
      ? (() => {
          const rankedData = [...data].sort(
            (left, right) => right.quoteCount - left.quoteCount,
          );
          if (rankedData.length <= 5) {
            return rankedData.sort((left, right) =>
              left.petType.localeCompare(right.petType, undefined, {
                sensitivity: "base",
              }),
            );
          }

          const topFive = rankedData.slice(0, 5);
          const remainingQuoteCount = rankedData
            .slice(5)
            .reduce((sum, entry) => sum + entry.quoteCount, 0);
          const othersShare = Number(
            ((remainingQuoteCount / Math.max(totalQuote, 1)) * 100).toFixed(1),
          );

          return [
            ...topFive,
            {
              fill: "#6f7896",
              petType: "Others",
              quoteCount: remainingQuoteCount,
              share: othersShare,
              shareLabel: formatPercent(othersShare),
            },
          ].sort((left, right) =>
            left.petType.localeCompare(right.petType, undefined, {
              sensitivity: "base",
            }),
          );
        })()
      : alphabeticalData;
  const renderVariantTooltip = ({
    active,
    payload,
  }: SingleDonutChartTooltipProps) => {
    if (!active || !payload?.length) {
      return null;
    }

    const datum = payload[0].payload as PetTypeMixDatum | undefined;
    if (!datum) {
      return null;
    }

    return (
      <div className={style.tooltip}>
        <div className={style.tooltipTitle}>{datum.petType}</div>
        <div className={style.tooltipRow}>
          <span>{tooltipMetricLabel}</span>
          <strong>{formatCount(datum.quoteCount)}</strong>
        </div>
        <div className={style.tooltipRow}>
          <span>Mix</span>
          <strong>{formatPercent(datum.share)}</strong>
        </div>
      </div>
    );
  };

  return (
    <div
      className={joinClassNames(
        style.mixLayout,
        expanded && style.analysisMixLayout,
      )}
    >
      <div className={style.chartShell}>
        <SingleDonutChart
          className={expanded ? style.analysisDonutChart : style.donutChart}
          cornerRadius={10}
          data={displayData}
          dataKey="quoteCount"
          innerRadius="74%"
          nameKey="petType"
          outerRadius="100%"
          paddingAngle={4}
          renderTooltip={renderVariantTooltip}
          showTooltip
        />
        <div className={style.centerStat}>
          <span className={style.centerLabel}>{centerLabel}</span>
          <strong className={style.centerValue}>
            {formatCount(totalQuote)}
          </strong>
        </div>
      </div>

      <PetTypeMixLegend
        className={expanded ? style.analysisLegend : undefined}
        data={displayData}
      />
    </div>
  );
};
