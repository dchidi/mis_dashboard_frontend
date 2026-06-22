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
import {
  type QuoteByCountryCardData,
  type QuoteByCountryViewRow,
} from "../data";
import {
  getMetricViewDescriptor,
  type MetricViewVariant,
} from "../metricView";
import { getTrendSeriesOptions } from "../QuotePerformance/config";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";
import style from "./QuoteByCountry.module.css";

const formatCount = (value: number) => value.toLocaleString();
const formatPercent = (value: number) => `${value}%`;
const formatGrowth = (value: number) => `${value > 0 ? "+" : ""}${value}%`;

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

interface QuoteByCountryProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
  data?: QuoteByCountryCardData;
  metricViewVariant?: MetricViewVariant;
}

const QuoteByCountry: React.FC<QuoteByCountryProps> = ({
  activeTrendSeriesKey,
  className,
  data,
  metricViewVariant = "quote",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const trendSeriesOptions = getTrendSeriesOptions(metricViewVariant);
  const activeTrendSeries =
    trendSeriesOptions.find((series) => series.key === activeTrendSeriesKey) ??
    trendSeriesOptions[0];
  const metricDescriptor = getMetricViewDescriptor(
    activeTrendSeriesKey,
    metricViewVariant,
  );
  const primaryMetricLabel =
    metricViewVariant === "policy" ? "Policy" : "Quote";
  const primaryShareLabel =
    metricViewVariant === "policy" ? "Policy Share" : "Quote Share";
  if (!data) {
    return null;
  }
  const activeView = data[activeTrendSeriesKey];

  if (!activeView || !activeView.tableRows.length) {
    return null;
  }

  const renderQuoteCountryTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: ReadonlyArray<{ payload?: QuoteByCountryViewRow }>;
  }) => {
    if (!active || !payload?.length) {
      return null;
    }

    const datum = payload[0].payload as QuoteByCountryViewRow | undefined;
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
            <span>{`Total ${primaryMetricLabel}`}</span>
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
            {activeTrendSeriesKey === "totalSales"
              ? "Sales Share"
              : primaryShareLabel}
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
  const countryColumns: TableColumn<QuoteByCountryViewRow>[] =
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
            header: `Total ${primaryMetricLabel}`,
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
              header: `Total ${primaryMetricLabel}`,
              headerAlign: "right",
              key: "total-quote",
              render: (row) => formatCount(row.totalQuote),
              width: "18%",
            },
            {
              cellAlign: "right",
              header: primaryShareLabel,
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
      rows={activeView.tableRows}
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
          data={activeView.chartData}
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
                    items={activeView.insights as InsightPanelItem[]}
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
