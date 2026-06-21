import type { ReactNode } from "react";
import Table, { type TableColumn } from "../../../ui/table/Table";
import { type QuoteTrendDatum } from "../data";
import { formatCount, formatPercent } from "./helpers";
import style from "./QuotePerformance.module.css";

interface QuoteMetricRow {
  id: string;
  label: string;
  values: ReactNode[];
}

type TrendDirection = "higher-is-better" | "lower-is-better";

const buildMetricValues = (
  values: number[],
  formatter: (value: number) => string,
  trendDirection: TrendDirection = "higher-is-better",
) =>
  values.map((value, index) => {
    const previousValue = values[index - 1];
    const movementClassName =
      value > previousValue ? style.metricTrendUp : style.metricTrendDown;
    const toneClassName =
      trendDirection === "lower-is-better"
        ? value < previousValue
          ? style.metricTrendTonePositive
          : style.metricTrendToneNegative
        : value > previousValue
          ? style.metricTrendTonePositive
          : style.metricTrendToneNegative;

    return (
      <span className={style.metricValue} key={`${formatter(value)}-${index}`}>
        {index === 0 || value === previousValue ? (
          <span
            aria-hidden="true"
            className={`${style.metricTrendIndicator} ${style.metricTrendNeutral}`}
          />
        ) : (
          <span
            aria-hidden="true"
            className={`${style.metricTrendIndicator} ${movementClassName} ${toneClassName}`}
          />
        )}
        <span className={style.metricValueText}>{formatter(value)}</span>
      </span>
    );
  });

const formatDays = (value: number) => `${value}d`;

interface QuoteMetricsProps {
  expanded: boolean;
  trendData: QuoteTrendDatum[];
}

const QuoteMetrics: React.FC<QuoteMetricsProps> = ({ expanded, trendData }) => {
  const monthColumns: TableColumn<QuoteMetricRow>[] = [
    {
      header: "Metric",
      isRowHeader: true,
      key: "metric",
      render: (row) => row.label,
      width: "22%",
    },
    ...trendData.map((datum, index) => ({
      cellAlign: "right" as const,
      header: datum.month,
      headerAlign: "right" as const,
      key: datum.month,
      render: (row: QuoteMetricRow) => row.values[index] ?? "0",
      width: "13%",
    })),
  ];
  const metricRows: QuoteMetricRow[] = [
    {
      id: "total-quote",
      label: "Total Quote",
      values: buildMetricValues(
        trendData.map((datum) => datum.totalQuote),
        formatCount,
      ),
    },
    {
      id: "total-sales",
      label: "Total Sales",
      values: buildMetricValues(
        trendData.map((datum) => datum.totalSales),
        formatCount,
      ),
    },
    {
      id: "conversion-rate",
      label: "Conversion %",
      values: buildMetricValues(
        trendData.map((datum) => datum.conversionRate),
        formatPercent,
      ),
    },
    {
      id: "avg-time-to-convert",
      label: "Avg. Time to Convert",
      values: buildMetricValues(
        trendData.map((datum) => datum.averageTimeToConvertDays),
        formatDays,
        "lower-is-better",
      ),
    },
  ];

  return (
    <Table
      className={style.metricsTable}
      columns={monthColumns}
      layout="fixed"
      minWidth={expanded ? "48rem" : "42rem"}
      mobileMinWidth={expanded ? "48rem" : "42rem"}
      rowKey={(row) => row.id}
      rows={metricRows}
      size="small"
      stickySpacerWidth="0.55rem"
    />
  );
};

export default QuoteMetrics;
