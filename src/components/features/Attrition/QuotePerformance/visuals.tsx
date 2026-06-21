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
  type PetTypeMixDatum,
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
import style from "./QuotePerformance.module.css";

const renderBrandTooltip = ({
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
        <span>Quote Volume</span>
        <strong>{formatCount(datum.quoteCount)}</strong>
      </div>
      <div className={style.tooltipRow}>
        <span>Contribution</span>
        <strong>{formatPercent(datum.share)}</strong>
      </div>
    </div>
  );
};

const renderPetTypeTooltip = ({
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
        <span>Quotes</span>
        <strong>{formatCount(datum.quoteCount)}</strong>
      </div>
      <div className={style.tooltipRow}>
        <span>Mix</span>
        <strong>{formatPercent(datum.share)}</strong>
      </div>
    </div>
  );
};

interface QuoteTrendVisualProps {
  activeTrendSeries: TrendSeriesOption;
  activeTrendSeriesKey: TrendSeriesKey;
  expanded: boolean;
  onTrendSeriesChange: (key: TrendSeriesKey) => void;
  showSeriesSelector?: boolean;
  trendData: QuoteTrendDatum[];
}

export const QuoteTrendVisual: React.FC<QuoteTrendVisualProps> = ({
  activeTrendSeries,
  activeTrendSeriesKey,
  expanded,
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
          showPreviousYearRows
          trendData={trendData}
        />
      ) : null}
    </>
  );
};

export const BrandContributionVisual: React.FC<{
  data?: BrandContributionDatum[];
  expanded: boolean;
}> = ({ data = [], expanded }) => {
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
      renderTooltip={renderBrandTooltip}
      showTooltip
      valueKey="quoteCount"
    />
  );
};

export const ConversionTrendVisual: React.FC<{
  expanded: boolean;
  trendData: QuoteTrendDatum[];
}> = ({ expanded, trendData }) => {
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
      {expanded ? <QuoteMetrics expanded trendData={trendData} /> : null}
    </>
  );
};

export const PetTypeMixVisual: React.FC<{
  data?: PetTypeMixDatum[];
  expanded: boolean;
}> = ({ data = [], expanded }) => {
  const totalQuotes = data.reduce((sum, entry) => sum + entry.quoteCount, 0);

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
          data={data}
          dataKey="quoteCount"
          innerRadius="74%"
          nameKey="petType"
          outerRadius="100%"
          paddingAngle={4}
          renderTooltip={renderPetTypeTooltip}
          showTooltip
        />
        <div className={style.centerStat}>
          <span className={style.centerLabel}>Total Quote</span>
          <strong className={style.centerValue}>
            {formatCount(totalQuotes)}
          </strong>
        </div>
      </div>

      <PetTypeMixLegend
        className={expanded ? style.analysisLegend : undefined}
        data={data}
      />
    </div>
  );
};
