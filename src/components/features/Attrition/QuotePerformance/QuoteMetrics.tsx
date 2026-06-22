import type { ReactNode } from "react";
import Table, { type TableColumn } from "../../../ui/table/Table";
import { type QuoteMetricTableData } from "../data";
import style from "./QuotePerformance.module.css";

interface QuoteMetricRow {
  id: string;
  label: string;
  values: ReactNode[];
}

interface QuoteMetricsProps {
  expanded: boolean;
  tableData: QuoteMetricTableData;
}

const QuoteMetrics: React.FC<QuoteMetricsProps> = ({ expanded, tableData }) => {
  const isDenseDayTable = tableData.months.length > 12;
  const rowHeaderWidth = isDenseDayTable ? "10rem" : "22%";
  const valueColumnWidth = isDenseDayTable ? "4.25rem" : "13%";
  const tableMinWidth = isDenseDayTable
    ? `${10 + tableData.months.length * 4.25}rem`
    : expanded
      ? "48rem"
      : "42rem";
  const monthColumns: TableColumn<QuoteMetricRow>[] = [
    {
      header: "Metric",
      isRowHeader: true,
      key: "metric",
      render: (row) => row.label,
      width: rowHeaderWidth,
    },
    ...tableData.months.map((month, index) => ({
      cellAlign: "right" as const,
      header: month,
      headerAlign: "right" as const,
      key: month,
      render: (row: QuoteMetricRow) => row.values[index] ?? "0",
      width: valueColumnWidth,
    })),
  ];
  const metricRows: QuoteMetricRow[] = tableData.rows.map((row) => ({
    id: row.id,
    label: row.label,
    values: row.values.map((value, index) => (
      <span className={style.metricValue} key={`${row.id}-${index}`}>
        <span
          aria-hidden="true"
          className={`${style.metricTrendIndicator} ${
            value.trend === "flat"
              ? style.metricTrendNeutral
              : value.trend === "up"
                ? style.metricTrendUp
                : style.metricTrendDown
          } ${
            value.tone === "positive"
              ? style.metricTrendTonePositive
              : value.tone === "negative"
                ? style.metricTrendToneNegative
                : ""
          }`}
        />
        <span className={style.metricValueText}>{value.display}</span>
      </span>
    )),
  }));

  return (
    <Table
      className={style.metricsTable}
      columns={monthColumns}
      layout="fixed"
      minWidth={tableMinWidth}
      mobileMinWidth={tableMinWidth}
      rowKey={(row) => row.id}
      rows={metricRows}
      size="small"
      stickySpacerWidth="0.55rem"
    />
  );
};

export default QuoteMetrics;
