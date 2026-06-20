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
  FaUpRightAndDownLeftFromCenter,
  FaXmark,
} from "react-icons/fa6";
import Card from "../../../ui/card/Card";
import InsightPanel, { type InsightPanelItem } from "../../../ui/insight_panel";
import SegmentedTabs from "../../../ui/segmented_tabs";
import SingleBarGraph, {
  type SingleBarGraphDatum,
  type SingleBarGraphTooltipProps,
} from "../../../ui/graph/bar_chart/SingleBarGraph";
import Table, { type TableColumn } from "../../../ui/table/Table";
import {
  lapsedQuoteByCountryData,
  pendingQuoteByCountryData,
  type PendingQuoteByCountryDatum,
  type QuoteAgingByCountryDatum,
} from "../data";
import type { AttritionComponentProps } from "../type";
import { formatAxisCount } from "../../../../utils/formatters";
import style from "./AttritionPotentialPredicators.module.css";

type QuoteWorkflowTabKey = "lapsed-quotes" | "pending-quotes";

interface LapsedQuoteWorkflowTabConfig {
  key: QuoteWorkflowTabKey;
  label: string;
  rows: QuoteAgingByCountryDatum[];
  subtitle: string;
  title: string;
}

interface PendingQuoteWorkflowTabConfig {
  key: QuoteWorkflowTabKey;
  label: string;
  rows: PendingQuoteByCountryDatum[];
  subtitle: string;
  title: string;
}

type QuoteWorkflowTabConfig =
  | (LapsedQuoteWorkflowTabConfig & { kind: "lapsed" })
  | (PendingQuoteWorkflowTabConfig & { kind: "pending" });

interface PendingQuoteChartDatum
  extends PendingQuoteByCountryDatum,
    SingleBarGraphDatum {
  fill: string;
  countryCode: string;
  pendingLabel: string;
}

interface LapsedQuoteChartDatum {
  bucket0To30: number;
  bucket31To60: number;
  bucket61To90: number;
  country: string;
  countryCode: string;
  total: number;
}

interface LapsedQuoteTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    payload?: LapsedQuoteChartDatum;
  }>;
}

const lapsedBucketConfig = [
  {
    color: "#4e8df5",
    key: "bucket0To30",
    label: "0-30 Days",
  },
  {
    color: "#33b18b",
    key: "bucket31To60",
    label: "31-60 Days",
  },
  {
    color: "#d7a13d",
    key: "bucket61To90",
    label: "61-90 Days",
  },
] as const;

const formatCount = (value: number) => value.toLocaleString();
const countryAbbreviationMap: Record<string, string> = {
  France: "FR",
  Germany: "DE",
  Ireland: "IE",
  Sweden: "SE",
  UK: "UK",
};

const formatPercent = (value: number) => `${Number(value.toFixed(1))}%`;

const renderPendingQuoteTooltip = ({
  active,
  payload,
}: SingleBarGraphTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload as PendingQuoteChartDatum | undefined;
  if (!datum) {
    return null;
  }

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{datum.country}</div>
      <div className={style.tooltipRow}>
        <span>Pending Quotes</span>
        <strong>{formatCount(datum.pendingQuotes)}</strong>
      </div>
    </div>
  );
};

const renderLapsedQuoteTooltip = ({
  active,
  payload,
}: LapsedQuoteTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload;
  if (!datum) {
    return null;
  }

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{datum.country}</div>
      {lapsedBucketConfig.map((bucket) => (
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

const quoteWorkflowTabs: QuoteWorkflowTabConfig[] = [
  {
    kind: "lapsed",
    key: "lapsed-quotes",
    label: "Lapsed Quotes",
    rows: lapsedQuoteByCountryData,
    subtitle: "Lapsed quotes aged by country across the current bucket ranges.",
    title: "Lapsed Quotes",
  },
  {
    kind: "pending",
    key: "pending-quotes",
    label: "Pending Quotes",
    rows: pendingQuoteByCountryData,
    subtitle: "Current pending quote queue by country.",
    title: "Pending Quotes by Country",
  },
];

const QuoteWorkflow: React.FC<AttritionComponentProps> = ({ className }) => {
  const [activeTab, setActiveTab] =
    useState<QuoteWorkflowTabKey>("lapsed-quotes");
  const [isExpanded, setIsExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const activeTabConfig =
    quoteWorkflowTabs.find((tab) => tab.key === activeTab) ?? quoteWorkflowTabs[0];
  const tabAccentRgb =
    activeTab === "lapsed-quotes" ? "215, 161, 61" : "78, 141, 245";
  const pendingQuoteChartData = useMemo<PendingQuoteChartDatum[]>(
    () =>
      pendingQuoteByCountryData.map((row, index) => ({
        ...row,
        countryCode:
          countryAbbreviationMap[row.country] ?? row.country.slice(0, 2),
        fill: index % 2 === 0 ? "#4e8df5" : "#33b18b",
        pendingLabel: formatCount(row.pendingQuotes),
      })),
    [],
  );
  const lapsedQuoteChartData = useMemo<LapsedQuoteChartDatum[]>(
    () =>
      lapsedQuoteByCountryData.map((row) => ({
        ...row,
        countryCode:
          countryAbbreviationMap[row.country] ?? row.country.slice(0, 2),
        total:
          row.bucket0To30 +
          row.bucket31To60 +
          row.bucket61To90,
      })),
    [],
  );
  const totalLapsedQuotes = lapsedQuoteChartData.reduce(
    (sum, row) => sum + row.total,
    0,
  );
  const lapsedRowsByTotal = [...lapsedQuoteChartData].sort(
    (left, right) => right.total - left.total,
  );
  const freshBucketTotal = lapsedQuoteChartData.reduce(
    (sum, row) => sum + row.bucket0To30,
    0,
  );
  const oldestMixRow = lapsedQuoteChartData.reduce((current, row) => {
    const currentLateShare = current.bucket61To90 / Math.max(current.total, 1);
    const nextLateShare = row.bucket61To90 / Math.max(row.total, 1);

    return nextLateShare > currentLateShare ? row : current;
  }, lapsedQuoteChartData[0]);
  const topTwoLapsedShare = Number(
    lapsedRowsByTotal
      .slice(0, 2)
      .reduce((sum, row) => sum + row.total, 0)
      .toFixed(0),
  );
  const lapsedInsights: InsightPanelItem[] = [
    {
      id: "recovery-window",
      label: "Recovery Window",
      note: `${formatPercent((freshBucketTotal / Math.max(totalLapsedQuotes, 1)) * 100)} of lapsed quotes are still inside 0-30 days.`,
      tone: "positive",
      value: formatPercent((freshBucketTotal / Math.max(totalLapsedQuotes, 1)) * 100),
    },
    {
      id: "top-two-load",
      label: "Top 2 Load",
      note: `${lapsedRowsByTotal[0]?.countryCode ?? ""} and ${lapsedRowsByTotal[1]?.countryCode ?? ""} account for most lapsed volume.`,
      tone: "neutral",
      value: formatPercent((topTwoLapsedShare / Math.max(totalLapsedQuotes, 1)) * 100),
    },
    {
      id: "oldest-mix",
      label: "Oldest Mix",
      note: `${oldestMixRow.countryCode} has the highest 61-90 day share in the lapsed book.`,
      tone: "negative",
      value: `${oldestMixRow.countryCode} ${formatPercent(
        (oldestMixRow.bucket61To90 / Math.max(oldestMixRow.total, 1)) * 100,
      )}`,
    },
  ];
  const totalPendingQuotes = pendingQuoteChartData.reduce(
    (sum, row) => sum + row.pendingQuotes,
    0,
  );
  const pendingRowsByTotal = [...pendingQuoteChartData].sort(
    (left, right) => right.pendingQuotes - left.pendingQuotes,
  );
  const pendingLeadRow = pendingRowsByTotal[0];
  const pendingTailRow = pendingRowsByTotal[pendingRowsByTotal.length - 1];
  const topTwoPendingTotal = pendingRowsByTotal
    .slice(0, 2)
    .reduce((sum, row) => sum + row.pendingQuotes, 0);
  const pendingInsights: InsightPanelItem[] = [
    {
      id: "lead-queue",
      label: "Lead Queue",
      note: `${pendingLeadRow.countryCode} holds ${formatPercent(
        (pendingLeadRow.pendingQuotes / Math.max(totalPendingQuotes, 1)) * 100,
      )} of pending quotes.`,
      tone: "neutral",
      value: `${pendingLeadRow.countryCode} ${formatCount(pendingLeadRow.pendingQuotes)}`,
    },
    {
      id: "top-two-pending",
      label: "Top 2 Load",
      note: `${pendingRowsByTotal[0]?.countryCode ?? ""} and ${pendingRowsByTotal[1]?.countryCode ?? ""} carry most pending intake.`,
      tone: "negative",
      value: formatPercent((topTwoPendingTotal / Math.max(totalPendingQuotes, 1)) * 100),
    },
    {
      id: "lightest-queue",
      label: "Lightest Queue",
      note: `${pendingTailRow.country} has the smallest pending workload in the current queue.`,
      tone: "positive",
      value: `${pendingTailRow.countryCode} ${formatCount(pendingTailRow.pendingQuotes)}`,
    },
  ];

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

  const renderPendingQuoteChart = (expanded: boolean) => (
    <SingleBarGraph
      barSize={22}
      categoryKey="countryCode"
      categoryWidth={expanded ? 54 : 42}
      className={expanded ? style.expandedChart : style.chart}
      color="#4e8df5"
      colorKey="fill"
      data={pendingQuoteChartData}
      gridStroke="rgba(107, 99, 117, 0.18)"
      hideNumericAxis={false}
      labelKey="pendingLabel"
      numericTickFormatter={formatAxisCount}
      orientation="horizontal"
      renderTooltip={renderPendingQuoteTooltip}
      showTooltip
      showValueLabels
      valueKey="pendingQuotes"
    />
  );

  const renderLapsedQuoteChart = (expanded: boolean) => (
    <div className={style.lapsedChartBlock}>
      <div className={expanded ? style.expandedChart : style.chart}>
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            accessibilityLayer={false}
            data={lapsedQuoteChartData}
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
            <XAxis
              axisLine={false}
              hide
              tickLine={false}
              type="number"
            />
            <YAxis
              axisLine={false}
              dataKey="countryCode"
              tick={{ fill: "var(--text)", fontSize: 12 }}
              tickLine={false}
              type="category"
              width={expanded ? 54 : 42}
            />
            <RechartsTooltip
              content={(tooltipProps) => (
                <>{renderLapsedQuoteTooltip(tooltipProps)}</>
              )}
              cursor={false}
              trigger="hover"
            />
            {lapsedBucketConfig.map((bucket, index) => {
              const radius: number | [number, number, number, number] =
                index === 0
                  ? [8, 0, 0, 8]
                  : index === lapsedBucketConfig.length - 1
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
                  {index === lapsedBucketConfig.length - 1 ? (
                    <LabelList
                      dataKey="total"
                      fill="var(--text-h)"
                      fontSize={12}
                      position="right"
                    />
                  ) : null}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={style.lapsedLegend}>
        {lapsedBucketConfig.map((bucket) => (
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
    </div>
  );

  const lapsedTable = (
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
      rows={lapsedQuoteByCountryData}
      size="small"
      stickySpacerWidth="0.55rem"
    />
  );

  const panelContentBody =
    activeTabConfig.kind === "pending"
      ? renderPendingQuoteChart(false)
      : renderLapsedQuoteChart(false);

  const expandedLayer =
    isExpanded && typeof document !== "undefined"
      ? createPortal(
          <div
            className={style.modalOverlay}
            onClick={() => setIsExpanded(false)}
            role="presentation"
          >
            <div
              aria-labelledby="quote-workflow-modal-title"
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
                      id="quote-workflow-modal-title"
                    >
                      {activeTabConfig.title}
                    </h3>
                  </div>
                </div>
                <button
                  aria-label="Close quote workflow expanded view"
                  className={style.closeButton}
                  onClick={() => setIsExpanded(false)}
                  type="button"
                >
                  <FaXmark aria-hidden="true" />
                </button>
              </div>

              {activeTabConfig.kind === "pending" ? (
                <p className={style.modalSubtitle}>{activeTabConfig.subtitle}</p>
              ) : null}

              <div className={style.expandedStack}>
                <div className={style.expandedTopGrid}>
                  {activeTabConfig.kind === "pending"
                    ? renderPendingQuoteChart(true)
                    : renderLapsedQuoteChart(true)}

                  <InsightPanel
                    accentRgb={tabAccentRgb}
                    items={
                      activeTabConfig.kind === "pending"
                        ? pendingInsights
                        : lapsedInsights
                    }
                  />
                </div>

                {activeTabConfig.kind === "lapsed"
                  ? lapsedTable("42rem", "42rem", style.expandedTableRegion)
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
            <div className={`cardTitle ${style.outerTitle}`}>Quote Workflow</div>
            <div className={style.topActions}>
              <button
                aria-haspopup="dialog"
                aria-label="Expand quote workflow"
                className={style.expandButton}
                onClick={() => setIsExpanded(true)}
                title="Expand card"
                type="button"
              >
                <FaUpRightAndDownLeftFromCenter
                  aria-hidden="true"
                  className={style.expandIcon}
                />
              </button>
            </div>
          </div>

          <SegmentedTabs
            accentRgb={tabAccentRgb}
            activeKey={activeTab}
            ariaLabel="Quote workflow views"
            idBase="quote-workflow"
            onChange={setActiveTab}
            options={quoteWorkflowTabs.map(({ key, label }) => ({ key, label }))}
          />

          <section
            aria-labelledby={`quote-workflow-tab-${activeTabConfig.key}`}
            className={style.panelBody}
            id={`quote-workflow-panel-${activeTabConfig.key}`}
            role="tabpanel"
          >
            <div className={style.panelContent}>
              {panelContentBody}
            </div>
          </section>
        </div>
      </Card>

      {expandedLayer}
    </>
  );
};

export default QuoteWorkflow;
