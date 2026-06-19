import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaFileLines,
  FaMinus,
  FaPercent,
  FaSackDollar,
} from "react-icons/fa6";
import Card from "../../../ui/card/Card";
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
  brandContributionData,
  petTypeMixData,
  petTypeMixTotalQuotes,
  topBrandContribution,
  topPetTypeMix,
  trendData,
  type BrandContributionDatum,
  type PetTypeMixDatum,
  type QuoteTrendDatum,
} from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./QuoteTrend.module.css";

const formatPercent = (value: number) => `${value}%`;
const formatDeltaPercent = (value: number) =>
  `${Math.abs(Number(value.toFixed(1)))}%`;
const formatCount = (value: number) => value.toLocaleString();
const formatAxisCount = (value: number) =>
  value >= 1000 ? `${Number((value / 1000).toFixed(1))}K` : formatCount(value);

const quoteCardTabs = [
  {
    key: "quote-trend",
    label: "Quote Trend",
    subtitle: "Monthly quotes, sales, and conversion performance.",
    title: "Quote Trend",
  },
  {
    key: "brand-contribution",
    label: "Brand Contribution",
    subtitle: "Quote volume and contribution across active brands.",
    title: "Brand Contribution",
  },
  {
    key: "pet-type-mix",
    label: "Pet Type Mix",
    subtitle: "Distribution of quotes by pet category.",
    title: "Pet Type Mix",
  },
] as const;

type QuoteCardTabKey = (typeof quoteCardTabs)[number]["key"];
type TrendSeriesKey = "totalQuote" | "totalSales" | "conversionRate";
type TrendSeriesPreviousYearKey =
  | "previousYearTotalQuote"
  | "previousYearTotalSales"
  | "previousYearConversionRate";

interface MetricTileProps {
  label: string;
  note: string;
  value: string;
}

interface KeyAlert {
  id: string;
  severity: "high" | "medium" | "low";
  tone: "risk" | "trend" | "exception";
  text: string;
}

interface TrendSeriesOption {
  color: string;
  description: string;
  icon: IconType;
  key: TrendSeriesKey;
  label: string;
  previousYearKey: TrendSeriesPreviousYearKey;
  valueFormatter: (value: number) => string;
}

const trendSeriesOptions: TrendSeriesOption[] = [
  {
    key: "totalQuote",
    label: "Total Quote",
    description: "Quote volume",
    icon: FaFileLines,
    previousYearKey: "previousYearTotalQuote",
    color: "#d47558",
    valueFormatter: formatCount,
  },
  {
    key: "totalSales",
    label: "Total Sales",
    description: "Sales volume",
    icon: FaSackDollar,
    previousYearKey: "previousYearTotalSales",
    color: "#33b18b",
    valueFormatter: formatCount,
  },
  {
    key: "conversionRate",
    label: "Conversion %",
    description: "Conversion rate",
    icon: FaPercent,
    previousYearKey: "previousYearConversionRate",
    color: "#4e8df5",
    valueFormatter: formatPercent,
  },
] as const;

const topTwoPetTypeShare = Number(
  petTypeMixData
    .slice(0, 2)
    .reduce((sum, entry) => sum + entry.share, 0)
    .toFixed(1),
);

const MetricTile: React.FC<MetricTileProps> = ({ label, note, value }) => {
  return (
    <article className={style.metricTile}>
      <span className={style.metricLabel}>{label}</span>
      <strong className={style.metricValue}>{value}</strong>
      <span className={style.metricNote}>{note}</span>
    </article>
  );
};

const KeyAlerts: React.FC<{ alerts: KeyAlert[] }> = ({ alerts }) => {
  return (
    <section className={style.alertPanel}>
      <div className={style.alertPanelTitle}>Key Alerts</div>
      <div className={style.alertList}>
        {alerts.map((alert) => (
          <article className={style.alertItem} key={alert.id}>
            <span
              className={[
                style.alertBadge,
                alert.severity === "high"
                  ? style.alertHigh
                  : alert.severity === "medium"
                    ? style.alertMedium
                    : style.alertLow,
              ].join(" ")}
            >
              <span aria-hidden="true" className={style.alertBadgeDot} />
            </span>
            <div className={style.alertContent}>
              <span className={style.alertEyebrow}>{alert.tone}</span>
              <p className={style.alertText}>{alert.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

const readTrendMetric = (
  datum: QuoteTrendDatum,
  key: TrendSeriesKey | TrendSeriesPreviousYearKey,
) => {
  const value = datum[key];
  return typeof value === "number" ? value : 0;
};

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

const QuoteTrend: React.FC<AttritionComponentProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<QuoteCardTabKey>("quote-trend");
  const [activeTrendSeriesKey, setActiveTrendSeriesKey] =
    useState<TrendSeriesKey>("totalQuote");
  const activeTabConfig =
    quoteCardTabs.find((tab) => tab.key === activeTab) ?? quoteCardTabs[0];
  const activeTrendSeries =
    trendSeriesOptions.find((series) => series.key === activeTrendSeriesKey) ??
    trendSeriesOptions[0];
  const activeTrendTitleLabel =
    activeTrendSeries.key === "conversionRate"
      ? "Conversion Rate"
      : activeTrendSeries.label.replace("Total ", "");
  const activePanelTitle =
    activeTab === "quote-trend"
      ? `Trend by ${activeTrendTitleLabel}`
      : activeTabConfig.title;
  const currentMonth = trendData[trendData.length - 1];
  const leadBrandContribution = topBrandContribution ?? brandContributionData[0];
  const leadPetTypeMix = topPetTypeMix ?? petTypeMixData[0];
  const brandContributionRanked = [...brandContributionData].sort(
    (left, right) => right.quoteCount - left.quoteCount,
  );
  const petTypeMixRanked = [...petTypeMixData].sort(
    (left, right) => right.quoteCount - left.quoteCount,
  );
  const brandHeadPair = brandContributionRanked.slice(0, 2);
  const brandMiddlePair = brandContributionRanked.slice(2, 4);
  const trailingBrandPair = brandContributionRanked.slice(-2);
  const nichePetTypeMix = petTypeMixRanked.slice(2, 4);
  const trailingPetTypeMix = petTypeMixRanked.slice(-3);

  if (!currentMonth || !leadBrandContribution || !leadPetTypeMix) {
    return null;
  }

  const currentTrendValue = readTrendMetric(currentMonth, activeTrendSeries.key);
  const previousYearTrendValue = readTrendMetric(
    currentMonth,
    activeTrendSeries.previousYearKey,
  );
  const percentChange =
    previousYearTrendValue === 0
      ? 0
      : ((currentTrendValue - previousYearTrendValue) / previousYearTrendValue) *
          100;
  const changeDirection =
    percentChange > 0 ? "up" : percentChange < 0 ? "down" : "flat";
  const changeDescription =
    changeDirection === "up"
      ? `${activeTrendSeries.description} increased`
      : changeDirection === "down"
        ? `${activeTrendSeries.description} declined`
        : `${activeTrendSeries.description} unchanged`;
  const ChangeIcon =
    changeDirection === "up"
      ? FaArrowTrendUp
      : changeDirection === "down"
        ? FaArrowTrendDown
        : FaMinus;
  const signalClassName = [
    style.signal,
    activeTab === "quote-trend"
      ? changeDirection === "up"
        ? style.signalPositive
        : changeDirection === "down"
          ? style.signalNegative
          : style.signalNeutral
      : activeTab === "brand-contribution"
        ? style.signalWarm
        : style.signalCool,
  ].join(" ");
  const brandHeadShare = Number(
    brandHeadPair.reduce((sum, entry) => sum + entry.share, 0).toFixed(1),
  );
  const brandMiddleShare = Number(
    brandMiddlePair.reduce((sum, entry) => sum + entry.share, 0).toFixed(1),
  );
  const trailingBrandShare = Number(
    trailingBrandPair.reduce((sum, entry) => sum + entry.share, 0).toFixed(1),
  );
  const nichePetTypeShare = Number(
    nichePetTypeMix.reduce((sum, entry) => sum + entry.share, 0).toFixed(1),
  );
  const trailingPetTypeShare = Number(
    trailingPetTypeMix.reduce((sum, entry) => sum + entry.share, 0).toFixed(1),
  );
  const brandAlerts: KeyAlert[] = [
    {
      id: "brand-core-risk",
      severity: "high",
      tone: "risk",
      text: `${brandHeadPair[0]?.brand ?? "Top brands"} and ${brandHeadPair[1]?.brand ?? "second brand"} account for ${formatPercent(brandHeadShare)} of brand quote volume, so pipeline health is still highly concentrated in two brands.`,
    },
    {
      id: "brand-mid-trend",
      severity: "medium",
      tone: "trend",
      text: `${brandMiddlePair[0]?.brand ?? "Mid-tier brands"} and ${brandMiddlePair[1]?.brand ?? "support brands"} contribute ${formatPercent(brandMiddleShare)} combined, which gives the portfolio a meaningful mid-tier support layer beyond the leaders.`,
    },
    {
      id: "brand-niche-exception",
      severity: "low",
      tone: "exception",
      text: `${trailingBrandPair[0]?.brand ?? "Niche brands"} and ${trailingBrandPair[1]?.brand ?? "tail brands"} make up ${formatPercent(trailingBrandShare)} together. They should be tracked as niche exceptions rather than judged against core-brand volume targets.`,
    },
  ];
  const petMixAlerts: KeyAlert[] = [
    {
      id: "petmix-core-trend",
      severity: "medium",
      tone: "trend",
      text: `Dogs and Cats still anchor ${formatPercent(topTwoPetTypeShare)} of the mix, so the book continues to lean on the core pet categories for stable volume.`,
    },
    {
      id: "petmix-niche-exception",
      severity: "low",
      tone: "exception",
      text: `${nichePetTypeMix[0]?.petType ?? "Niche segments"} and ${nichePetTypeMix[1]?.petType ?? "support segments"} already represent ${formatPercent(nichePetTypeShare)} combined, which is large enough to merit distinct messaging instead of being treated as residual traffic.`,
    },
    {
      id: "petmix-longtail-risk",
      severity: "high",
      tone: "risk",
      text: `The smallest three mix segments total ${formatPercent(trailingPetTypeShare)}. That long tail can swing quickly month to month, so quote quality there should be monitored separately from the core mix.`,
    },
  ];

  const signalContent =
    activeTab === "quote-trend" ? (
      <div
        aria-label={`${changeDescription} by ${formatDeltaPercent(percentChange)} year over year for ${activeTrendSeries.label}.`}
        className={signalClassName}
      >
        <span className={style.signalLabel}>YoY</span>
        <div className={style.signalValueRow}>
          <ChangeIcon aria-hidden="true" className={style.signalIcon} />
          <strong className={style.signalValue}>
            {formatDeltaPercent(percentChange)}
          </strong>
        </div>
      </div>
    ) : activeTab === "brand-contribution" ? (
      <div
        aria-label={`${leadBrandContribution.brand} leads brand contribution at ${formatPercent(leadBrandContribution.share)}.`}
        className={signalClassName}
      >
        <span className={style.signalLabel}>{leadBrandContribution.brand}</span>
        <div className={style.signalValueRow}>
          <span aria-hidden="true" className={style.signalDot} />
          <strong className={style.signalValue}>
            {formatPercent(leadBrandContribution.share)}
          </strong>
        </div>
      </div>
    ) : (
      <div
        aria-label={`${leadPetTypeMix.petType} account for ${formatPercent(leadPetTypeMix.share)} of quotes.`}
        className={signalClassName}
      >
        <span className={style.signalLabel}>{leadPetTypeMix.petType}</span>
        <div className={style.signalValueRow}>
          <span aria-hidden="true" className={style.signalDot} />
          <strong className={style.signalValue}>
            {formatPercent(leadPetTypeMix.share)}
          </strong>
        </div>
      </div>
    );

  const panelContent =
    activeTab === "quote-trend" ? (
      <>
        <div className={style.trendSeriesRow}>
          <div
            aria-label="Quote trend metric"
            className={style.trendSeriesGroup}
            role="group"
          >
            {trendSeriesOptions.map((series) => {
              const isActive = series.key === activeTrendSeriesKey;
              const SeriesIcon = series.icon;

              return (
                <button
                  aria-pressed={isActive}
                  aria-label={series.label}
                  className={[
                    style.trendSeriesButton,
                    isActive ? style.trendSeriesButtonActive : "",
                  ].join(" ")}
                  key={series.key}
                  onClick={() => setActiveTrendSeriesKey(series.key)}
                  title={series.label}
                  type="button"
                >
                  <SeriesIcon
                    aria-hidden="true"
                    className={style.trendSeriesButtonIcon}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <SingleAreaGraph
          className={style.chart}
          color={activeTrendSeries.color}
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
        <div className={style.metricGrid}>
          <MetricTile
            label="Total Quote"
            note={`Prev yr ${formatCount(currentMonth.previousYearTotalQuote)}`}
            value={formatCount(currentMonth.totalQuote)}
          />
          <MetricTile
            label="Total Sales"
            note={`Prev yr ${formatCount(currentMonth.previousYearTotalSales)}`}
            value={formatCount(currentMonth.totalSales)}
          />
          <MetricTile
            label="Conversion %"
            note={`Prev yr ${formatPercent(currentMonth.previousYearConversionRate)}`}
            value={formatPercent(currentMonth.conversionRate)}
          />
        </div>
      </>
    ) : activeTab === "brand-contribution" ? (
      <>
        <SingleBarGraph
          barSize={16}
          categoryKey="brand"
          categoryWidth={148}
          className={`${style.chart} ${style.brandChart}`}
          color="#d47558"
          colorKey="fill"
          data={brandContributionData}
          gridStroke="rgba(107, 99, 117, 0.18)"
          hideNumericAxis={false}
          numericTickFormatter={formatAxisCount}
          orientation="horizontal"
          renderTooltip={renderBrandTooltip}
          showTooltip
          valueKey="quoteCount"
        />
        <KeyAlerts alerts={brandAlerts} />
      </>
    ) : (
      <>
        <div className={style.mixLayout}>
          <div className={style.chartShell}>
            <SingleDonutChart
              className={style.donutChart}
              cornerRadius={10}
              data={petTypeMixData}
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
                {formatCount(petTypeMixTotalQuotes)}
              </strong>
            </div>
          </div>

          <div className={style.legend}>
            {petTypeMixData.map((entry) => (
              <div className={style.legendItem} key={entry.petType}>
                <span
                  className={style.legendSwatch}
                  style={{ backgroundColor: entry.fill }}
                />
                <div className={style.legendText}>
                  <span className={style.legendName} title={entry.petType}>
                    {entry.petType}
                  </span>
                  <span className={style.legendMeta}>
                    {formatCount(entry.quoteCount)} quotes
                  </span>
                </div>
                <strong className={style.legendValue}>
                  {formatPercent(entry.share)}
                </strong>
              </div>
            ))}
          </div>
        </div>
        <KeyAlerts alerts={petMixAlerts} />
      </>
    );

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className={style.topline}>
          <div className={style.outerTitle}>Quote Performance</div>
          {signalContent}
        </div>

        <div
          aria-label="Quote performance views"
          className={style.tabList}
          role="tablist"
        >
          {quoteCardTabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                aria-controls={`quote-panel-${tab.key}`}
                aria-selected={isActive}
                className={[
                  style.tabButton,
                  isActive ? style.tabButtonActive : "",
                ].join(" ")}
                id={`quote-tab-${tab.key}`}
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <section
          aria-labelledby={`quote-tab-${activeTab}`}
          className={style.panelBody}
          id={`quote-panel-${activeTab}`}
          key={activeTab}
          role="tabpanel"
        >
          <div className={style.panelContent}>
            <div className={style.panelIntro}>
              <div className={style.panelTitle}>{activePanelTitle}</div>
              <p className={style.subtitle}>{activeTabConfig.subtitle}</p>
            </div>
            {panelContent}
          </div>
        </section>
      </div>
    </Card>
  );
};

export default QuoteTrend;
