import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCaretDown,
  FaCaretRight,
  FaCaretUp,
  FaXmark,
} from "react-icons/fa6";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";
import Card from "../../../ui/card/Card";
import InsightPanel, { type InsightPanelItem } from "../../../ui/insight_panel";
import InsightButton from "../../../ui/insight_button";
import Table, { type TableColumn } from "../../../ui/table/Table";
import { quoteByCountryData, type QuoteByCountryDatum } from "../data";
import { getMetricViewDescriptor } from "../metricView";
import { trendSeriesOptions } from "../QuotePerformance/config";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";
import style from "./QuoteByCountry.module.css";

const formatCount = (value: number) => value.toLocaleString();
const formatPercent = (value: number) => `${value}%`;
const formatGrowth = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

interface QuoteByCountryChartDatum extends QuoteByCountryDatum {
  countryCode: string;
  metricLabel: string;
  metricValue: number;
  salesShare: number;
  totalSales: number;
}

const countryAbbreviationMap: Record<QuoteByCountryDatum["country"], string> = {
  France: "FR",
  Germany: "DE",
  Ireland: "IE",
  Sweden: "SE",
  UK: "UK",
};

const renderGrowthValue = (growth: number) => {
  const GrowthIcon =
    growth > 0 ? FaCaretUp : growth < 0 ? FaCaretDown : FaCaretRight;
  const growthClassName =
    growth > 0
      ? style.growthPositive
      : growth < 0
        ? style.growthNegative
        : style.growthNeutral;

  return (
    <span className={`${style.growthValue} ${growthClassName}`}>
      <GrowthIcon aria-hidden="true" className={style.growthIcon} />
      {formatGrowth(growth)}
    </span>
  );
};

const joinCountryCodes = (rows: QuoteByCountryChartDatum[]) =>
  rows.map((row) => row.countryCode).join(", ");

interface QuoteByCountryProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
  data?: QuoteByCountryDatum[];
}

const QuoteByCountry: React.FC<QuoteByCountryProps> = ({
  activeTrendSeriesKey,
  className,
  data = quoteByCountryData,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const activeTrendSeries =
    trendSeriesOptions.find((series) => series.key === activeTrendSeriesKey) ??
    trendSeriesOptions[0];
  const metricDescriptor = getMetricViewDescriptor(activeTrendSeriesKey);
  const countryRowsWithSales = data.map((row) => ({
    ...row,
    totalSales: Math.max(1, Math.round((row.totalQuote * row.conversionRate) / 100)),
  }));
  const totalSales = countryRowsWithSales.reduce(
    (sum, row) => sum + row.totalSales,
    0,
  );
  const chartData: QuoteByCountryChartDatum[] = countryRowsWithSales.map((row) => {
    const metricValue =
      activeTrendSeriesKey === "conversionRate"
        ? row.conversionRate
        : activeTrendSeriesKey === "totalSales"
          ? row.totalSales
          : row.totalQuote;

    return {
      ...row,
      countryCode:
        countryAbbreviationMap[row.country] ?? row.country.slice(0, 2),
      metricLabel: activeTrendSeries.valueFormatter(metricValue),
      metricValue,
      salesShare:
        totalSales === 0
          ? 0
          : Number(((row.totalSales / totalSales) * 100).toFixed(1)),
    };
  });
  const metricSortedRows = [...chartData].sort(
    (left, right) => right.metricValue - left.metricValue,
  );
  const quoteShareSortedRows = [...chartData].sort(
    (left, right) => right.quoteShare - left.quoteShare,
  );
  const salesShareSortedRows = [...chartData].sort(
    (left, right) => right.salesShare - left.salesShare,
  );
  const leader = metricSortedRows[0];
  const trailer = metricSortedRows[metricSortedRows.length - 1];
  const belowConversionThresholdRows = chartData.filter(
    (row) => row.conversionRate < 2.5,
  );
  const topTwoQuoteShare = Number(
    quoteShareSortedRows
      .slice(0, 2)
      .reduce((sum, row) => sum + row.quoteShare, 0)
      .toFixed(1),
  );
  const topTwoSalesShare = Number(
    salesShareSortedRows
      .slice(0, 2)
      .reduce((sum, row) => sum + row.salesShare, 0)
      .toFixed(1),
  );
  const averageConversion = Number(
    (
      chartData.reduce((sum, row) => sum + row.conversionRate, 0) /
      Math.max(chartData.length, 1)
    ).toFixed(1),
  );
  const conversionSpread = Number(
    ((leader?.conversionRate ?? 0) - (trailer?.conversionRate ?? 0)).toFixed(1),
  );
  const underIndexRow = chartData.reduce((current, row) => {
    const currentDelta = current.salesShare - current.quoteShare;
    const nextDelta = row.salesShare - row.quoteShare;

    return nextDelta < currentDelta ? row : current;
  }, chartData[0]);
  const insights: InsightPanelItem[] =
    activeTrendSeriesKey === "conversionRate"
      ? [
          {
            id: "best-conversion",
            label: "Best Conversion",
            note: `${leader.countryCode} converts ${(
              leader.conversionRate - averageConversion
            ).toFixed(1)} pts above the market average.`,
            tone: "positive",
            value: `${leader.countryCode} ${formatPercent(leader.conversionRate)}`,
          },
          {
            id: "conversion-spread",
            label: "Spread",
            note: `${leader.countryCode} to ${trailer.countryCode} is the current conversion performance gap.`,
            tone: "neutral",
            value: `${conversionSpread} pts`,
          },
          {
            id: "conversion-watchlist",
            label: "Watchlist",
            note:
              belowConversionThresholdRows.length > 0
                ? `${joinCountryCodes(belowConversionThresholdRows)} sit below the 2.5% conversion threshold.`
                : "Every country is holding above the 2.5% conversion threshold.",
            tone: belowConversionThresholdRows.length > 0 ? "negative" : "positive",
            value:
              belowConversionThresholdRows.length > 0
                ? `${belowConversionThresholdRows.length} markets below 2.5%`
                : "No markets below 2.5%",
          },
        ]
      : activeTrendSeriesKey === "totalSales"
        ? [
            {
              id: "converted-leader",
              label: "Lead Market",
              note: `${leader.countryCode} drives ${formatPercent(leader.salesShare)} of sales volume.`,
              tone: "positive",
              value: `${leader.countryCode} ${formatCount(leader.totalSales)}`,
            },
            {
              id: "converted-concentration",
              label: "Top 2 Mix",
              note: `${salesShareSortedRows[0]?.countryCode ?? ""} and ${salesShareSortedRows[1]?.countryCode ?? ""} account for most sales volume.`,
              tone: "neutral",
              value: `${formatPercent(topTwoSalesShare)}`,
            },
            {
              id: "converted-under-index",
              label: "Under-indexing",
              note: `${underIndexRow.countryCode} converts ${formatPercent(underIndexRow.salesShare)} of sales from ${formatPercent(underIndexRow.quoteShare)} of quotes.`,
              tone: "negative",
              value: `${underIndexRow.countryCode} ${(
                underIndexRow.salesShare - underIndexRow.quoteShare
              ).toFixed(1)} pts`,
            },
          ]
        : [
            {
              id: "quoted-leader",
              label: "Lead Market",
              note: `${leader.countryCode} contributes ${formatPercent(leader.quoteShare)} of quoted volume.`,
              tone: "positive",
              value: `${leader.countryCode} ${formatCount(leader.totalQuote)}`,
            },
            {
              id: "quoted-concentration",
              label: "Top 2 Mix",
              note: `${quoteShareSortedRows[0]?.countryCode ?? ""} and ${quoteShareSortedRows[1]?.countryCode ?? ""} account for most quote intake.`,
              tone: "neutral",
              value: `${formatPercent(topTwoQuoteShare)}`,
            },
            {
              id: "quoted-watchlist",
              label: "Low Conversion",
              note: `${trailer.countryCode} has the weakest conversion against current quote volume.`,
              tone: "negative",
              value: `${trailer.countryCode} ${formatPercent(trailer.conversionRate)}`,
            },
          ];
  const renderQuoteCountryTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{ payload?: QuoteByCountryChartDatum }>;
  }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const datum = payload[0].payload as QuoteByCountryChartDatum | undefined;
    if (!datum) {
      return null;
    }

    return (
      <div className={style.tooltip}>
        <div className={style.tooltipTitle}>{datum.country}</div>
        <div className={style.tooltipRow}>
          <span>{activeTrendSeries.label}</span>
          <strong>{activeTrendSeries.valueFormatter(datum.metricValue)}</strong>
        </div>
        {activeTrendSeriesKey !== "totalQuote" ? (
          <div className={style.tooltipRow}>
            <span>Total Quote</span>
            <strong>{formatCount(datum.totalQuote)}</strong>
          </div>
        ) : null}
        {activeTrendSeriesKey !== "totalSales" ? (
          <div className={style.tooltipRow}>
            <span>Total Sales</span>
            <strong>{formatCount(datum.totalSales)}</strong>
          </div>
        ) : null}
        <div className={style.tooltipRow}>
          <span>
            {activeTrendSeriesKey === "totalSales" ? "Sales Share" : "Quote Share"}
          </span>
          <strong>
            {formatPercent(
              activeTrendSeriesKey === "totalSales"
                ? datum.salesShare
                : datum.quoteShare,
            )}
          </strong>
        </div>
        <div className={style.tooltipRow}>
          <span>Growth</span>
          <strong>{formatGrowth(datum.growth)}</strong>
        </div>
      </div>
    );
  };
  const countryColumns: TableColumn<QuoteByCountryChartDatum>[] =
    activeTrendSeriesKey === "conversionRate"
      ? [
          {
            key: "country",
            header: "Country",
            isRowHeader: true,
            render: (row) => row.country,
            width: "22%",
          },
          {
            cellAlign: "right",
            header: "Conversion %",
            headerAlign: "right",
            key: "conversion-rate",
            render: (row) => formatPercent(row.conversionRate),
            width: "20%",
          },
          {
            cellAlign: "right",
            header: "Total Quote",
            headerAlign: "right",
            key: "total-quote",
            render: (row) => formatCount(row.totalQuote),
            width: "18%",
          },
          {
            cellAlign: "right",
            header: "Total Sales",
            headerAlign: "right",
            key: "total-sales",
            render: (row) => formatCount(row.totalSales),
            width: "18%",
          },
          {
            cellAlign: "right",
            header: "Growth",
            headerAlign: "right",
            key: "growth",
            render: (row) => renderGrowthValue(row.growth),
            width: "22%",
          },
        ]
      : activeTrendSeriesKey === "totalSales"
        ? [
            {
              key: "country",
              header: "Country",
              isRowHeader: true,
              render: (row) => row.country,
              width: "22%",
            },
            {
              cellAlign: "right",
              header: "Total Sales",
              headerAlign: "right",
              key: "total-sales",
              render: (row) => formatCount(row.totalSales),
              width: "18%",
            },
            {
              cellAlign: "right",
              header: "Sales Share",
              headerAlign: "right",
              key: "sales-share",
              render: (row) => formatPercent(row.salesShare),
              width: "20%",
            },
            {
              cellAlign: "right",
              header: "Conversion %",
              headerAlign: "right",
              key: "conversion-rate",
              render: (row) => formatPercent(row.conversionRate),
              width: "18%",
            },
            {
              cellAlign: "right",
              header: "Growth",
              headerAlign: "right",
              key: "growth",
              render: (row) => renderGrowthValue(row.growth),
              width: "22%",
            },
          ]
        : [
            {
              key: "country",
              header: "Country",
              isRowHeader: true,
              render: (row) => row.country,
              width: "22%",
            },
            {
              cellAlign: "right",
              header: "Total Quote",
              headerAlign: "right",
              key: "total-quote",
              render: (row) => formatCount(row.totalQuote),
              width: "18%",
            },
            {
              cellAlign: "right",
              header: "Quote Share",
              headerAlign: "right",
              key: "quote-share",
              render: (row) => formatPercent(row.quoteShare),
              width: "20%",
            },
            {
              cellAlign: "right",
              header: "Conversion %",
              headerAlign: "right",
              key: "conversion-rate",
              render: (row) => formatPercent(row.conversionRate),
              width: "18%",
            },
            {
              cellAlign: "right",
              header: "Growth",
              headerAlign: "right",
              key: "growth",
              render: (row) => renderGrowthValue(row.growth),
              width: "22%",
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

  const tableContent = (minWidth: string, mobileMinWidth: string) => (
    <Table
      className={style.tableRegion}
      columns={countryColumns}
      layout="auto"
      minWidth={minWidth}
      mobileMinWidth={mobileMinWidth}
      rowKey={(row) => row.country}
      rows={chartData}
      size="small"
      stickySpacerWidth="0.55rem"
    />
  );

  const chartContent = (expanded: boolean) => (
    <div className={expanded ? style.expandedChart : style.chart}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          accessibilityLayer={false}
          barCategoryGap={expanded ? "12%" : "8%"}
          data={chartData}
          margin={{
            top: 8,
            right: 0,
            left: 0,
            bottom: 0,
          }}
          onContextMenu={(_, event) => event.preventDefault()}
        >
          <CartesianGrid
            horizontal
            stroke="rgba(107, 99, 117, 0.18)"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="countryCode"
            interval={0}
            tick={{ fill: "var(--text)", fontSize: 12 }}
            tickLine={false}
          />
          <RechartsTooltip
            content={(tooltipProps) => (
              <>{renderQuoteCountryTooltip(tooltipProps)}</>
            )}
            cursor={false}
            trigger="hover"
          />
          <Bar
            dataKey="metricValue"
            fill={activeTrendSeries.color}
            maxBarSize={expanded ? 84 : 72}
            radius={[8, 8, 0, 0]}
          >
            <LabelList
              dataKey="metricLabel"
              fill="var(--text-h)"
              fontSize={12}
              position="top"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const expandedLayer =
    isExpanded && typeof document !== "undefined"
      ? createPortal(
          <div
            className={style.modalOverlay}
            onClick={() => setIsExpanded(false)}
            role="presentation"
          >
            <div
              aria-labelledby="quote-by-country-modal-title"
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
                  <h3
                    className={style.modalTitle}
                    id="quote-by-country-modal-title"
                  >
                    {metricDescriptor.countryTitle}
                  </h3>
                </div>
                <button
                  aria-label="Close quote by country expanded view"
                  className={style.closeButton}
                  onClick={() => setIsExpanded(false)}
                  type="button"
                >
                  <FaXmark aria-hidden="true" />
                </button>
              </div>
              {/* 
              <p className={style.modalSubtitle}>
                Country-level quote mix with current conversion and growth
                movement.
              </p> */}

              <div className={style.expandedStack}>
                <div className={style.expandedTopGrid}>
                  {chartContent(true)}

                  <InsightPanel
                    accentRgb={activeTrendSeries.accentRgb}
                    items={insights}
                  />
                </div>

                {tableContent("48rem", "48rem")}
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
          <div className={style.header}>
            <div className="cardTitle">{metricDescriptor.countryTitle}</div>
            <InsightButton
              accentRgb={activeTrendSeries.accentRgb}
              ariaLabel={`Open ${metricDescriptor.countryTitle.toLowerCase()} insights`}
              onClick={() => setIsExpanded(true)}
              title={`View ${metricDescriptor.countryTitle} insights`}
            />
          </div>
          {/* <p className={style.subtitle}>
            Country-level quote mix with current conversion and growth
            movement.
          </p> */}

          {chartContent(false)}
        </div>
      </Card>

      {expandedLayer}
    </>
  );
};

export default QuoteByCountry;
