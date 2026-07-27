import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCaretDown,
  FaCaretRight,
  FaCaretUp,
  FaXmark,
} from "react-icons/fa6";
import { RiDownloadCloud2Line, RiLoader4Line } from "react-icons/ri";
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
import { formatCompactNumber } from "../../../../utils/formatters";
import style from "./QuoteByCountry.module.css";

const formatCount = (value: number) => value.toLocaleString();
const formatPercent = (value: number) => `${value}%`;
const formatGrowth = (value: number) => `${value > 0 ? "+" : ""}${value}%`;
const formatTopPetTypeCoverage = (
  petTypes: ReadonlyArray<{ totalQuote: number }>,
  totalQuote: number,
) => {
  const topThreeTotal = petTypes.reduce(
    (total, petType) => total + petType.totalQuote,
    0,
  );
  const coverage = totalQuote
    ? ((topThreeTotal / totalQuote) * 100).toFixed(1)
    : "0.0";

  return `${formatCount(topThreeTotal)} out of ${formatCount(
    totalQuote,
  )} (${coverage}%)`;
};
const formatChartMetricLabel = (
  metricValue: number,
  metricKey: TrendSeriesKey,
) =>
  metricKey === "conversionRate"
    ? formatPercent(metricValue)
    : formatCompactNumber(metricValue);

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
  downloadDisabled?: boolean;
  isDownloadInProgress?: boolean;
  metricViewVariant?: MetricViewVariant;
  onDownload?: () => void;
  reportingPeriodLabel?: string;
}

const QuoteByCountry: React.FC<QuoteByCountryProps> = ({
  activeTrendSeriesKey,
  className,
  data,
  downloadDisabled = false,
  isDownloadInProgress = false,
  metricViewVariant = "quote",
  onDownload,
  reportingPeriodLabel,
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
  const convertedMetricLabel =
    metricViewVariant === "quote" ? "Converted Quotes" : "Total Sales";
  if (!data) {
    return null;
  }
  const activeView = data[activeTrendSeriesKey];

  if (!activeView || !activeView.tableRows.length) {
    return null;
  }
  const isQuoteVolumeView =
    metricViewVariant === "quote" && activeTrendSeriesKey === "totalQuote";
  const quoteRowsByGrowth = [...activeView.tableRows].sort(
    (left, right) =>
      right.growth - left.growth || right.totalQuote - left.totalQuote,
  );
  const topQuoteRowsByVolume = [...activeView.tableRows].sort(
    (left, right) => right.totalQuote - left.totalQuote,
  );
  const leadQuoteCountry = topQuoteRowsByVolume[0];
  const leastQuoteCountry = quoteRowsByGrowth[quoteRowsByGrowth.length - 1];
  const topTwoQuoteShare = topQuoteRowsByVolume
    .slice(0, 2)
    .reduce((total, row) => total + row.quoteShare, 0);
  const displayedInsights: InsightPanelItem[] = isQuoteVolumeView
    ? [
        {
          id: "quoted-leader",
          label: "Lead Market",
          note: `${leadQuoteCountry.countryCode} contributes ${formatPercent(
            leadQuoteCountry.quoteShare,
          )} of quoted volume and recorded ${formatGrowth(
            leadQuoteCountry.growth,
          )} growth.`,
          tone: "positive",
          value: leadQuoteCountry.countryCode,
        },
        {
          id: "quoted-concentration",
          label: "Top 2 Mix",
          note: `${topQuoteRowsByVolume[0].countryCode} and ${
            topQuoteRowsByVolume[1]?.countryCode ??
            topQuoteRowsByVolume[0].countryCode
          } account for most quote intake.`,
          tone: "neutral",
          value: formatPercent(Number(topTwoQuoteShare.toFixed(1))),
        },
        {
          id: "quoted-trailer",
          label: "Least Performing",
          note: `${leastQuoteCountry.countryCode} recorded ${formatGrowth(
            leastQuoteCountry.growth,
          )} growth and contributed ${formatPercent(
            leastQuoteCountry.quoteShare,
          )} of total quote volume.`,
          tone: "negative",
          value: leastQuoteCountry.countryCode,
        },
      ]
    : (activeView.insights as InsightPanelItem[]);

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
          <span>
            {activeTrendSeriesKey === "totalSales"
              ? convertedMetricLabel
              : activeTrendSeries.label}
          </span>
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
            <span>{convertedMetricLabel}</span>
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

  const displayedCountryColumns = isQuoteVolumeView
    ? countryColumns
        .filter((column) => column.key !== "conversion-rate")
        .map((column) => ({ ...column, width: "25%" }))
    : countryColumns;

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
      columns={displayedCountryColumns}
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
            top: expanded ? 30 : 24,
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
              dataKey="metricValue"
              fill="var(--text-h)"
              fontSize={11}
              formatter={(value) => {
                const numericValue =
                  typeof value === "number"
                    ? value
                    : typeof value === "string"
                      ? Number(value)
                      : 0;

                return formatChartMetricLabel(numericValue, activeTrendSeriesKey);
              }}
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
                <div className={style.modalActions}>
                  {isQuoteVolumeView && onDownload ? (
                    <button
                      aria-busy={isDownloadInProgress}
                      aria-label="Download Quote by Country workbook"
                      className={style.downloadButton}
                      disabled={downloadDisabled || isDownloadInProgress}
                      onClick={onDownload}
                      title="Download chart and raw quote data"
                      type="button"
                    >
                      {isDownloadInProgress ? (
                        <RiLoader4Line
                          aria-hidden="true"
                          className={style.downloadSpinner}
                        />
                      ) : (
                        <RiDownloadCloud2Line aria-hidden="true" />
                      )}
                    </button>
                  ) : null}
                  <button
                    aria-label="Close quote by country expanded view"
                    className={style.closeButton}
                    onClick={() => setIsExpanded(false)}
                    type="button"
                  >
                    <FaXmark aria-hidden="true" />
                  </button>
                </div>
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
                    items={displayedInsights}
                  />
                </div>

                {isQuoteVolumeView && data.topPetTypesByCountry.length ? (
                  <section
                    aria-labelledby="quote-country-pet-type-title"
                    className={style.petTypeInsights}
                  >
                    <div className={style.petTypeInsightsHeader}>
                      <h4
                        className={style.petTypeInsightsTitle}
                        id="quote-country-pet-type-title"
                      >
                        Top 3 Pet Types by Region
                      </h4>
                      <span className={style.petTypeInsightsMeta}>
                        Ranked by quote volume
                      </span>
                    </div>

                    <div className={style.petTypeRegionGrid}>
                      {data.topPetTypesByCountry.map((region) => (
                        <article
                          className={style.petTypeRegionCard}
                          key={region.countryCode}
                        >
                          <div className={style.petTypeRegionHeader}>
                            <div className={style.petTypeRegionName}>
                              <strong>{region.countryCode}</strong>
                              <span>{region.country}</span>
                            </div>
                            <span className={style.petTypeRegionTotal}>
                              {formatTopPetTypeCoverage(
                                region.petTypes,
                                region.totalQuote,
                              )}
                            </span>
                          </div>

                          <div className={style.petTypeMiniTableWrap}>
                            <table className={style.petTypeMiniTable}>
                              <thead>
                                <tr>
                                  <th>Pet Type</th>
                                  <th>Quotes</th>
                                  <th>Share</th>
                                </tr>
                              </thead>
                              <tbody>
                                {region.petTypes.map((petType) => (
                                  <tr
                                    key={`${region.countryCode}-${petType.petType}`}
                                  >
                                    <td>{petType.petType}</td>
                                    <td>{formatCount(petType.totalQuote)}</td>
                                    <td>{formatPercent(petType.quoteShare)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}

                {tableContent("48rem", "48rem")}
              </div>
              {reportingPeriodLabel ? (
                <footer className={style.modalFooter}>
                  <div className={style.reportingPeriod}>
                    Reporting period: {reportingPeriodLabel}
                  </div>
                </footer>
              ) : null}
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
