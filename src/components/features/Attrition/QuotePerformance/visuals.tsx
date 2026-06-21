import SingleAreaGraph, {
  type SingleAreaGraphTooltipProps,
} from "../../../ui/graph/area_graph/SingleAreaGraph";
import SingleBarGraph, {
  type SingleBarGraphTooltipProps,
} from "../../../ui/graph/bar_chart/SingleBarGraph";
import SingleDonutChart, {
  type SingleDonutChartTooltipProps,
} from "../../../ui/graph/donut_chart/SingleDonutChart";
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
  readTrendMetric,
} from "./helpers";
import QuoteMetrics from "./QuoteMetrics";
import PetTypeMixLegend from "./PetTypeMixLegend";
import TrendSeriesSelector from "./TrendSeriesSelector";
import type { TrendSeriesKey, TrendSeriesOption } from "./types";
import style from "./QuotePerformance.module.css";

const renderTrendTooltip =
  (activeSeries: TrendSeriesOption) =>
  ({ active, label, payload }: SingleAreaGraphTooltipProps) => {
    if (!active || !payload?.length) {
      return null;
    }

    const datum = payload[0].payload as QuoteTrendDatum | undefined;
    if (!datum) {
      return null;
    }

    return (
      <div className={style.tooltip}>
        <div className={style.tooltipTitle}>{label}</div>
        <div className={style.tooltipRow}>
          <span>{activeSeries.label}</span>
          <strong>
            {activeSeries.valueFormatter(readTrendMetric(datum, activeSeries.key))}
          </strong>
        </div>
        <div className={style.tooltipRow}>
          <span>{datum.previousYearMonth}</span>
          <strong>
            {activeSeries.valueFormatter(
              readTrendMetric(datum, activeSeries.previousYearKey),
            )}
          </strong>
        </div>
        <div className={style.tooltipDivider} />
        <div className={style.tooltipRow}>
          <span>Total Quote</span>
          <strong>{formatCount(datum.totalQuote)}</strong>
        </div>
        <div className={style.tooltipRow}>
          <span>Total Sales</span>
          <strong>{formatCount(datum.totalSales)}</strong>
        </div>
        <div className={style.tooltipRow}>
          <span>Conversion %</span>
          <strong>{formatPercent(datum.conversionRate)}</strong>
        </div>
      </div>
    );
  };

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
      <SingleAreaGraph
        className={expanded ? style.analysisAreaChart : style.chart}
        color={quoteTrendChartColor}
        data={trendData}
        renderTooltip={renderTrendTooltip(activeTrendSeries)}
        showTooltip
        showValueLabels
        valueLabelColor="var(--text)"
        valueLabelFormatter={(value) =>
          typeof value === "number"
            ? activeTrendSeries.valueFormatter(value)
            : value
        }
        xDataKey="month"
        yDataKey={activeTrendSeries.key}
      />
      {expanded ? <QuoteMetrics expanded trendData={trendData} /> : null}
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
