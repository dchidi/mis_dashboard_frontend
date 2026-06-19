import { FaArrowTrendDown, FaArrowTrendUp, FaMinus } from "react-icons/fa6";
import Card from "../../../ui/card/Card";
import SingleAreaGraph, {
  type SingleAreaGraphTooltipProps,
} from "../../../ui/graph/area_graph/SingleAreaGraph";
import Table, { type TableColumn } from "../../../ui/table/Table";
import { trendData, type AttritionTrendDatum } from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./AttritionTrend.module.css";

const formatPercent = (value: number) => `${value}%`;
const formatDeltaPercent = (value: number) =>
  `${Math.abs(Number(value.toFixed(1)))}%`;
const formatHeadcount = (value: number) => value.toLocaleString();

interface TrendMetricRow {
  key: string;
  label: string;
  renderValue: (datum: AttritionTrendDatum) => string;
}

const trendMetricRows: TrendMetricRow[] = [
  {
    key: "average-headcount",
    label: "Average Headcount",
    renderValue: (datum: AttritionTrendDatum) =>
      formatHeadcount(datum.averageHeadcount),
  },
  {
    key: "attrition-rate",
    label: "Attrition Rate",
    renderValue: (datum: AttritionTrendDatum) =>
      formatPercent(datum.turnoverRate),
  },
  {
    key: "retention-percent",
    label: "Retention %",
    renderValue: (datum: AttritionTrendDatum) =>
      formatPercent(datum.retentionPercent),
  },
];

const trendColumns: TableColumn<TrendMetricRow>[] = [
  {
    key: "metric",
    header: "Metric",
    isRowHeader: true,
    render: (row) => row.label,
    width: "10.5rem",
  },
  ...trendData.map((datum) => ({
    key: datum.month,
    header: datum.month,
    cellAlign: "center" as const,
    headerAlign: "center" as const,
    render: (row: TrendMetricRow) => row.renderValue(datum),
  })),
];

const renderTrendTooltip = ({
  active,
  label,
  payload,
}: SingleAreaGraphTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload as AttritionTrendDatum | undefined;
  if (!datum) {
    return null;
  }
  const maleShare = Math.round(
    (datum.maleAttrition / datum.totalAttrition) * 100,
  );
  const femaleShare = Math.round(
    (datum.femaleAttrition / datum.totalAttrition) * 100,
  );

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{label}</div>
      <div className={style.tooltipRow}>
        <span>Total Attrition</span>
        <strong>{datum.totalAttrition}</strong>
      </div>
      <div className={style.tooltipRow}>
        <span>Attrition Rate</span>
        <strong>{formatPercent(datum.turnoverRate)}</strong>
      </div>
      <div className={style.tooltipDivider} />
      <div className={style.tooltipRow}>
        <span>Male</span>
        <strong>
          {datum.maleAttrition} ({maleShare}%)
        </strong>
      </div>
      <div className={style.tooltipRow}>
        <span>Female</span>
        <strong>
          {datum.femaleAttrition} ({femaleShare}%)
        </strong>
      </div>
    </div>
  );
};

const AttritionTrend: React.FC<AttritionComponentProps> = ({ className }) => {
  const currentMonth = trendData[trendData.length - 1];
  const previousMonth = trendData[trendData.length - 2];
  const percentChange =
    previousMonth.turnoverRate === 0
      ? 0
      : ((currentMonth.turnoverRate - previousMonth.turnoverRate) /
          previousMonth.turnoverRate) *
        100;
  const changeDirection =
    percentChange > 0 ? "up" : percentChange < 0 ? "down" : "flat";
  const changeDescription =
    changeDirection === "up"
      ? "Attrition increased"
      : changeDirection === "down"
        ? "Attrition declined"
        : "Attrition unchanged";
  const ChangeIcon =
    changeDirection === "up"
      ? FaArrowTrendUp
      : changeDirection === "down"
        ? FaArrowTrendDown
        : FaMinus;
  const deltaBadgeClassName = [
    style.deltaBadge,
    changeDirection === "up"
      ? style.deltaUp
      : changeDirection === "down"
        ? style.deltaDown
        : style.deltaFlat,
  ].join(" ");

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className={style.header}>
          <div className="cardTitle">Monthly Attrition Rate (%)</div>
          <div
            aria-label={`${changeDescription} by ${formatDeltaPercent(percentChange)}. ${currentMonth.month} vs ${previousMonth.month}.`}
            className={deltaBadgeClassName}
          >
            <div className={style.deltaSummary}>
              <ChangeIcon aria-hidden="true" className={style.deltaIcon} />
              <strong className={style.deltaValue}>
                {formatDeltaPercent(percentChange)}
              </strong>
            </div>
            <span className={style.deltaMeta}>
              {currentMonth.month} vs {previousMonth.month}
            </span>
          </div>
        </div>
        <SingleAreaGraph
          className={style.chart}
          color="#c05a52"
          data={trendData}
          renderTooltip={renderTrendTooltip}
          showTooltip
          showValueLabels
          valueLabelColor="var(--text)"
          valueLabelFormatter={(value) =>
            typeof value === "number" ? formatPercent(value) : value
          }
          xDataKey="month"
          yDataKey="turnoverRate"
        />
        <Table
          columns={trendColumns}
          minWidth="40rem"
          mobileMinWidth="34rem"
          nowrap
          rowKey={(row) => row.key}
          rows={trendMetricRows}
          size="small"
        />
      </div>
    </Card>
  );
};
export default AttritionTrend;
