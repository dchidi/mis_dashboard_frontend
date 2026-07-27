import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FaCaretDown,
  FaCaretRight,
  FaCaretUp,
  FaXmark,
} from "react-icons/fa6";
import Card from "../../../ui/card/Card";
import InsightPanel, { type InsightPanelItem } from "../../../ui/insight_panel";
import InsightButton from "../../../ui/insight_button";
import SegmentedTabs from "../../../ui/segmented_tabs";
import SingleBarGraph, {
  type SingleBarGraphTooltipProps,
} from "../../../ui/graph/bar_chart/SingleBarGraph";
import Table, { type TableColumn } from "../../../ui/table/Table";
import {
  type LapsedQuoteChartDatum,
  type QuoteAgingByCountryDatum,
  type QuoteWorkflowCardData,
  type QuoteWorkflowTabKey,
  type WorkflowBarChartDatum,
  type WorkflowReasonTableRow,
} from "../data";
import type { AttritionComponentProps } from "../type";
import { formatAxisCount } from "../../../../utils/formatters";
import style from "./AttritionPotentialPredicators.module.css";

interface QuoteWorkflowProps extends AttritionComponentProps {
  data?: QuoteWorkflowCardData;
}

const formatCount = (value: number) => value.toLocaleString();
const formatPercent = (value: number) => `${value}%`;
const formatChangePercent = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

const renderWorkflowChangeValue = (row: WorkflowReasonTableRow) => {
  const ChangeIcon =
    row.yoyTrend === "up"
      ? FaCaretUp
      : row.yoyTrend === "down"
        ? FaCaretDown
        : FaCaretRight;
  const toneClassName =
    row.yoyTrend === "up"
      ? style.growthPositive
      : row.yoyTrend === "down"
        ? style.growthNegative
        : style.growthNeutral;

  return (
    <span className={`${style.growthValue} ${toneClassName}`}>
      <ChangeIcon aria-hidden="true" className={style.growthIcon} />
      {formatChangePercent(row.yoyChange)}
    </span>
  );
};

const quoteWorkflowColumns: TableColumn<QuoteAgingByCountryDatum>[] = [
  {
    key: "country",
    header: "Country",
    isRowHeader: true,
    render: (row) => row.country,
    width: "24%",
  },
  {
    cellAlign: "right",
    header: "0-30 Days",
    headerAlign: "right",
    key: "bucket-0-30",
    render: (row) => formatCount(row.bucket0To30),
    width: "24%",
  },
  {
    cellAlign: "right",
    header: "31-60 Days",
    headerAlign: "right",
    key: "bucket-31-60",
    render: (row) => formatCount(row.bucket31To60),
    width: "24%",
  },
  {
    cellAlign: "right",
    header: "61-90 Days",
    headerAlign: "right",
    key: "bucket-61-90",
    render: (row) => formatCount(row.bucket61To90),
    width: "24%",
  },
];

const workflowReasonColumns: TableColumn<WorkflowReasonTableRow>[] = [
  {
    key: "reason",
    header: "Reason",
    isRowHeader: true,
    render: (row) => row.reason,
    width: "38%",
  },
  {
    cellAlign: "right",
    header: "Count",
    headerAlign: "right",
    key: "count",
    render: (row) => formatCount(row.count),
    width: "18%",
  },
  {
    cellAlign: "right",
    header: "Share",
    headerAlign: "right",
    key: "share",
    render: (row) => formatPercent(row.share),
    width: "18%",
  },
  {
    cellAlign: "right",
    header: "YoY %",
    headerAlign: "right",
    key: "yoy",
    render: renderWorkflowChangeValue,
    width: "26%",
  },
];

const QUOTE_WORKFLOW_TAB_ORDER: Record<QuoteWorkflowTabKey, number> = {
  "converted-quotes": 0,
  "pending-quotes": 1,
  "lapsed-quotes": 2,
};

const QuoteWorkflow: React.FC<QuoteWorkflowProps> = ({ className, data }) => {
  const tabs = useMemo(
    () =>
      [...(data?.tabs ?? [])].sort(
        (left, right) =>
          QUOTE_WORKFLOW_TAB_ORDER[left.key] -
          QUOTE_WORKFLOW_TAB_ORDER[right.key],
      ),
    [data?.tabs],
  );
  const [activeTab, setActiveTab] = useState<QuoteWorkflowTabKey>(
    tabs[0]?.key ?? "converted-quotes",
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const activeTabData = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const workflowTitle = data?.title ?? "Quote Workflow";
  const workflowIdBase = data?.idBase ?? "quote-workflow";
  const workflowTitleLabel = workflowTitle.toLowerCase();

  useEffect(() => {
    if (!tabs.length) {
      return;
    }

    if (!tabs.some((tab) => tab.key === activeTab)) {
      setActiveTab(tabs[0].key);
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    if (!isExpanded || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => {
      modalRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  if (!activeTabData) {
    return null;
  }

  const renderLapsedQuoteTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{
      payload?: LapsedQuoteChartDatum;
    }>;
  }) => {
    if (!active || !payload?.length || activeTabData.kind !== "lapsed") {
      return null;
    }

    const datum = payload[0].payload;
    if (!datum) {
      return null;
    }

    return (
      <div className={style.tooltip}>
        <div className={style.tooltipTitle}>{datum.country}</div>
        {activeTabData.buckets.map((bucket) => (
          <div className={style.tooltipRow} key={bucket.key}>
            <span className={style.tooltipLabel}>
              <span
                aria-hidden="true"
                className={style.tooltipSwatch}
                style={{ backgroundColor: bucket.color }}
              />
              {bucket.label}
            </span>
            <strong>{formatCount(datum[bucket.key])}</strong>
          </div>
        ))}
        <div className={style.tooltipDivider} />
        <div className={style.tooltipRow}>
          <span>Total</span>
          <strong>{formatCount(datum.total)}</strong>
        </div>
      </div>
    );
  };

  const renderBarChartTooltip = ({
    active,
    payload,
  }: SingleBarGraphTooltipProps) => {
    if (!active || !payload?.length || activeTabData.kind !== "bar") {
      return null;
    }

    const datum = payload[0].payload as WorkflowBarChartDatum | undefined;
    if (!datum) {
      return null;
    }

    return (
      <div className={style.tooltip}>
        <div className={style.tooltipTitle}>{datum.country}</div>
        <div className={style.tooltipRow}>
          <span>{activeTabData.metricLabel}</span>
          <strong>{datum.valueLabel}</strong>
        </div>
      </div>
    );
  };

  const renderBarChart = (
    chartData: WorkflowBarChartDatum[],
    expanded: boolean,
  ) => (
    <SingleBarGraph
      barSize={22}
      categoryKey="countryCode"
      categoryWidth={expanded ? 54 : 42}
      className={expanded ? style.expandedChart : style.chart}
      color="#4e8df5"
      colorKey="fill"
      data={chartData}
      gridStroke="rgba(107, 99, 117, 0.18)"
      hideNumericAxis={false}
      labelKey="valueLabel"
      numericTickFormatter={
        activeTabData.kind === "bar" && activeTabData.numericTickKind === "percent"
          ? formatPercent
          : formatAxisCount
      }
      orientation="horizontal"
      renderTooltip={renderBarChartTooltip}
      showTooltip
      showValueLabels
      valueKey="value"
    />
  );

  const renderLapsedQuoteChart = (
    chartData: LapsedQuoteChartDatum[],
    expanded: boolean,
  ) => (
    <div className={style.lapsedChartBlock}>
      <div className={expanded ? style.expandedChart : style.chart}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            accessibilityLayer={false}
            data={chartData}
            layout="vertical"
            margin={{
              top: 8,
              right: 8,
              left: 0,
              bottom: 8,
            }}
            onContextMenu={(_, event) => event.preventDefault()}
          >
            <CartesianGrid
              horizontal={false}
              stroke="rgba(107, 99, 117, 0.12)"
              strokeDasharray="4 4"
              vertical
            />
            <XAxis axisLine={false} hide tickLine={false} type="number" />
            <YAxis
              axisLine={false}
              dataKey="countryCode"
              tick={{ fill: "var(--text)", fontSize: 12 }}
              tickLine={false}
              type="category"
              width={expanded ? 54 : 42}
            />
            <RechartsTooltip
              content={(tooltipProps) => <>{renderLapsedQuoteTooltip(tooltipProps)}</>}
              cursor={false}
              trigger="hover"
            />
            {activeTabData.kind === "lapsed"
              ? activeTabData.buckets.map((bucket, index) => {
                  const radius: number | [number, number, number, number] =
                    index === 0
                      ? [8, 0, 0, 8]
                      : index === activeTabData.buckets.length - 1
                        ? [0, 8, 8, 0]
                        : 0;

                  return (
                    <Bar
                      barSize={expanded ? 28 : 24}
                      dataKey={bucket.key}
                      fill={bucket.color}
                      key={bucket.key}
                      radius={radius}
                      stackId="lapsed-aging"
                    >
                      {index === activeTabData.buckets.length - 1 ? (
                        <LabelList
                          dataKey="total"
                          fill="var(--text-h)"
                          fontSize={12}
                          position="right"
                        />
                      ) : null}
                    </Bar>
                  );
                })
              : null}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {activeTabData.kind === "lapsed" ? (
        <div className={style.lapsedLegend}>
          {activeTabData.buckets.map((bucket) => (
            <div className={style.lapsedLegendItem} key={bucket.key}>
              <span
                aria-hidden="true"
                className={style.lapsedLegendSwatch}
                style={{ backgroundColor: bucket.color }}
              />
              <span className={style.lapsedLegendLabel}>{bucket.label}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  const lapsedTable = (
    rows: QuoteAgingByCountryDatum[],
    minWidth: string,
    mobileMinWidth: string,
    className?: string,
  ) => (
    <Table
      className={className ?? style.tableRegion}
      columns={quoteWorkflowColumns}
      layout="fixed"
      minWidth={minWidth}
      mobileMinWidth={mobileMinWidth}
      rowKey={(row) => row.country}
      rows={rows}
      size="small"
      stickySpacerWidth="0.55rem"
    />
  );

  const reasonTable = (
    rows: WorkflowReasonTableRow[],
    minWidth: string,
    mobileMinWidth: string,
    className?: string,
  ) => (
    <Table
      className={className ?? style.tableRegion}
      columns={workflowReasonColumns}
      layout="fixed"
      minWidth={minWidth}
      mobileMinWidth={mobileMinWidth}
      rowKey={(row) => row.id}
      rows={rows}
      size="small"
      stickySpacerWidth="0.55rem"
    />
  );

  const reasonTableSection = (
    rows: WorkflowReasonTableRow[],
    topShare: number,
  ) => (
    <div className={style.reasonTableSection}>
      <div className={style.reasonTableHeader}>
        <span className={style.reasonTableTitle}>Top 10 Reasons</span>
        <span className={style.reasonTableMeta}>
          {`${formatPercent(topShare)} top 10 share`}
        </span>
      </div>
      {reasonTable(rows, "36rem", "36rem", style.expandedTableRegion)}
    </div>
  );

  const panelContentBody =
    activeTabData.kind === "bar"
      ? renderBarChart(activeTabData.chartData, false)
      : renderLapsedQuoteChart(activeTabData.chartData, false);

  const expandedLayer =
    isExpanded && typeof document !== "undefined"
      ? createPortal(
          <div
            className={style.modalOverlay}
            onClick={() => setIsExpanded(false)}
            role="presentation"
          >
            <div
              aria-labelledby={`${workflowIdBase}-modal-title`}
              aria-modal="true"
              className={style.modal}
              onClick={(event) => event.stopPropagation()}
              ref={modalRef}
              role="dialog"
              tabIndex={-1}
            >
              <div className={style.modalHeader}>
                <div>
                  <div className={style.modalEyebrow}>Expanded View</div>
                  <div className={style.modalTitleRow}>
                    <h3
                      className={style.modalTitle}
                      id={`${workflowIdBase}-modal-title`}
                    >
                      {activeTabData.title}
                    </h3>
                  </div>
                </div>
                <button
                  aria-label={`Close ${workflowTitleLabel} expanded view`}
                  className={style.closeButton}
                  onClick={() => setIsExpanded(false)}
                  type="button"
                >
                  <FaXmark aria-hidden="true" />
                </button>
              </div>

              {activeTabData.kind === "bar" ? (
                <p className={style.modalSubtitle}>{activeTabData.subtitle}</p>
              ) : null}

              <div className={style.expandedStack}>
                <div className={style.expandedTopGrid}>
                  {activeTabData.kind === "bar"
                    ? renderBarChart(activeTabData.chartData, true)
                    : renderLapsedQuoteChart(activeTabData.chartData, true)}

                  <InsightPanel
                    accentRgb={activeTabData.accentRgb}
                    items={activeTabData.insights as InsightPanelItem[]}
                  />
                </div>

                {activeTabData.kind === "lapsed"
                  ? lapsedTable(
                      activeTabData.tableRows,
                      "42rem",
                      "42rem",
                      style.expandedTableRegion,
                    )
                  : activeTabData.reasonTableRows?.length
                    ? reasonTableSection(
                        activeTabData.reasonTableRows,
                        activeTabData.reasonTableShare ?? 0,
                      )
                    : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Card className={className}>
        <div className={style.root}>
          <div className={style.topline}>
            <div className={`cardTitle ${style.outerTitle}`}>{workflowTitle}</div>
            <div className={style.topActions}>
              <InsightButton
                accentRgb={activeTabData.accentRgb}
                ariaLabel={`Open ${workflowTitleLabel} insights`}
                onClick={() => setIsExpanded(true)}
                title={`View ${workflowTitleLabel} insights`}
              />
            </div>
          </div>

          <SegmentedTabs
            accentRgb={activeTabData.accentRgb}
            activeKey={activeTab}
            ariaLabel={`${workflowTitle} views`}
            idBase={workflowIdBase}
            onChange={(key) => setActiveTab(key as QuoteWorkflowTabKey)}
            options={tabs.map(({ key, label }) => ({ key, label }))}
          />

          <section
            aria-labelledby={`${workflowIdBase}-tab-${activeTabData.key}`}
            className={style.panelBody}
            id={`${workflowIdBase}-panel-${activeTabData.key}`}
            role="tabpanel"
          >
            <div className={style.panelContent}>{panelContentBody}</div>
          </section>
        </div>
      </Card>

      {expandedLayer}
    </>
  );
};

export default QuoteWorkflow;
