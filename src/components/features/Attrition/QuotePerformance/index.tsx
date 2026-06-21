import { useState } from "react";
import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaMinus,
} from "react-icons/fa6";
import Card from "../../../ui/card/Card";
import InsightButton from "../../../ui/insight_button";
import {
  type BrandContributionDatum,
  type PetTypeMixDatum,
  type QuoteTrendDatum,
} from "../data";
import { getMetricViewDescriptor } from "../metricView";
import type { AttritionComponentProps } from "../type";
import AnalysisLayer from "./AnalysisLayer";
import { quoteCardTabs, trendSeriesOptions } from "./config";
import {
  formatDeltaPercent,
  formatPercent,
  joinClassNames,
  readTrendMetric,
} from "./helpers";
import { buildAnalysisContent } from "./insights";
import type {
  Direction,
  QuoteCardTabKey,
  Tone,
  TrendSeriesKey,
} from "./types";
import {
  BrandContributionVisual,
  ConversionTrendVisual,
  PetTypeMixVisual,
  QuoteTrendVisual,
} from "./visuals";
import SegmentedTabs from "../../../ui/segmented_tabs";
import style from "./QuotePerformance.module.css";

const toneClassMap: Record<Tone, string> = {
  cool: style.signalCool,
  negative: style.signalNegative,
  neutral: style.signalNeutral,
  positive: style.signalPositive,
  warm: style.signalWarm,
};

const analysisToneClassMap: Record<Tone, string> = {
  cool: style.analysisSpotlightCool,
  negative: style.analysisSpotlightNegative,
  neutral: style.analysisSpotlightNeutral,
  positive: style.analysisSpotlightPositive,
  warm: style.analysisSpotlightWarm,
};

interface QuotePerformanceProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
  brandContributionData?: BrandContributionDatum[];
  petTypeMixData?: PetTypeMixDatum[];
  onTrendSeriesChange: (key: TrendSeriesKey) => void;
  trendData?: QuoteTrendDatum[];
}

const QuotePerformance: React.FC<QuotePerformanceProps> = ({
  activeTrendSeriesKey,
  brandContributionData = [],
  className,
  petTypeMixData = [],
  onTrendSeriesChange,
  trendData = [],
}) => {
  const [activeTab, setActiveTab] = useState<QuoteCardTabKey>("quote-trend");
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const activeTrendSeries =
    trendSeriesOptions.find((series) => series.key === activeTrendSeriesKey) ??
    trendSeriesOptions[0];
  const conversionTrendSeries =
    trendSeriesOptions.find((series) => series.key === "conversionRate") ??
    trendSeriesOptions[0];
  const metricDescriptor = getMetricViewDescriptor(activeTrendSeriesKey);
  const resolvedTabs = quoteCardTabs.map((tab) =>
    tab.key === "quote-trend"
      ? {
          ...tab,
          label:
            activeTrendSeries.key === "conversionRate"
              ? "Conversion Performance"
              : metricDescriptor.trendTabLabel,
          subtitle:
            activeTrendSeries.key === "conversionRate"
              ? "Monthly conversion performance versus prior year."
              : activeTrendSeries.key === "totalSales"
                ? "Monthly sales volume and performance versus prior year."
                : "Monthly quoted volume and performance versus prior year.",
          title: metricDescriptor.trendTabLabel,
        }
      : tab,
  );
  const activeTabConfig =
    resolvedTabs.find((tab) => tab.key === activeTab) ?? resolvedTabs[0];
  const isQuoteTrendActive = activeTab === "quote-trend";
  const isConversionTrendActive = activeTab === "conversion-trend";
  const isTrendTabActive = isQuoteTrendActive || isConversionTrendActive;
  const activeSeriesForTab = isConversionTrendActive
    ? conversionTrendSeries
    : activeTrendSeries;
  const activeTrendTitleLabel =
    activeSeriesForTab.key === "conversionRate"
      ? "Conversion Rate"
      : activeSeriesForTab.label.replace("Total ", "");
  const activePanelTitle =
    isTrendTabActive
      ? `${activeTrendTitleLabel} Trend`
      : activeTabConfig.title;
  const quoteTabAccentRgb =
    isTrendTabActive
      ? activeSeriesForTab.accentRgb
      : activeTab === "brand-contribution"
        ? "212, 117, 88"
        : "78, 141, 245";
  const currentMonth = trendData[trendData.length - 1];
  const leadBrandContribution = [...brandContributionData].sort(
    (left, right) => right.quoteCount - left.quoteCount,
  )[0];
  const leadPetTypeMix = [...petTypeMixData].sort(
    (left, right) => right.quoteCount - left.quoteCount,
  )[0];

  if (!currentMonth || !leadBrandContribution || !leadPetTypeMix) {
    return null;
  }

  const currentTrendValue = readTrendMetric(currentMonth, activeSeriesForTab.key);
  const previousYearTrendValue = readTrendMetric(
    currentMonth,
    activeSeriesForTab.previousYearKey,
  );
  const percentChange =
    previousYearTrendValue === 0
      ? 0
      : ((currentTrendValue - previousYearTrendValue) / previousYearTrendValue) *
          100;
  const changeDirection: Direction =
    percentChange > 0 ? "up" : percentChange < 0 ? "down" : "flat";
  const changeDescription =
    changeDirection === "up"
      ? `${activeSeriesForTab.description} increased`
      : changeDirection === "down"
        ? `${activeSeriesForTab.description} declined`
        : `${activeSeriesForTab.description} unchanged`;
  const ChangeIcon =
    changeDirection === "up"
      ? FaArrowTrendUp
      : changeDirection === "down"
        ? FaArrowTrendDown
        : FaMinus;
  const signalTone: Tone =
    isTrendTabActive
      ? changeDirection === "up"
        ? "positive"
        : changeDirection === "down"
          ? "negative"
          : "neutral"
      : activeTab === "brand-contribution"
        ? "warm"
        : "cool";
  const signalClassName = joinClassNames(style.signal, toneClassMap[signalTone]);
  const analysisContent = buildAnalysisContent({
    activeTab,
    activeTrendSeries: activeSeriesForTab,
    brandContributionData,
    changeDirection,
    currentMonth,
    petTypeMixData,
    percentChange,
  });
  const analysisSpotlightToneClass =
    analysisToneClassMap[analysisContent.analysisSpotlightTone];

  const signalContent =
    isTrendTabActive ? (
      <div
        aria-label={`${changeDescription} by ${formatDeltaPercent(percentChange)} year over year for ${activeSeriesForTab.label}.`}
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

  const cardVisualContent =
    activeTab === "quote-trend" ? (
      <QuoteTrendVisual
        activeTrendSeries={activeTrendSeries}
        activeTrendSeriesKey={activeTrendSeriesKey}
        expanded={false}
        onTrendSeriesChange={onTrendSeriesChange}
        showSeriesSelector={false}
        trendData={trendData}
      />
    ) : activeTab === "conversion-trend" ? (
      <ConversionTrendVisual expanded={false} trendData={trendData} />
    ) : activeTab === "brand-contribution" ? (
      <BrandContributionVisual
        data={brandContributionData}
        expanded={false}
      />
    ) : (
      <PetTypeMixVisual data={petTypeMixData} expanded={false} />
    );

  const analysisVisualContent =
    activeTab === "quote-trend" ? (
      <QuoteTrendVisual
        activeTrendSeries={activeTrendSeries}
        activeTrendSeriesKey={activeTrendSeriesKey}
        expanded
        onTrendSeriesChange={onTrendSeriesChange}
        showSeriesSelector={false}
        trendData={trendData}
      />
    ) : activeTab === "conversion-trend" ? (
      <ConversionTrendVisual expanded trendData={trendData} />
    ) : activeTab === "brand-contribution" ? (
      <BrandContributionVisual data={brandContributionData} expanded />
    ) : (
      <PetTypeMixVisual data={petTypeMixData} expanded />
    );

  const analysisSpotlightGraphic =
    isTrendTabActive ? (
      <ChangeIcon
        aria-hidden="true"
        className={joinClassNames(
          style.analysisSpotlightIcon,
          analysisSpotlightToneClass,
        )}
      />
    ) : (
      <span
        aria-hidden="true"
        className={joinClassNames(
          style.analysisSpotlightDot,
          analysisSpotlightToneClass,
        )}
      />
    );

  return (
    <>
      <Card className={className}>
        <div className={style.root}>
          <div className={style.topline}>
            <div className={`cardTitle ${style.outerTitle}`}>
              {isQuoteTrendActive
                ? metricDescriptor.performanceTitle
                : activeTabConfig.title}
            </div>
            {signalContent}
          </div>

          <SegmentedTabs
            accentRgb={quoteTabAccentRgb}
            activeKey={activeTab}
            ariaLabel="Quote performance views"
            idBase="quote"
            onChange={setActiveTab}
            options={resolvedTabs.map(({ key, label }) => ({ key, label }))}
          />

          <section
            aria-labelledby={`quote-tab-${activeTab}`}
            className={joinClassNames(
              style.panelBody,
              isTrendTabActive && style.panelBodyQuoteTrend,
            )}
            id={`quote-panel-${activeTab}`}
            key={activeTab}
            role="tabpanel"
          >
            <div
              className={joinClassNames(
                style.panelContent,
                isTrendTabActive && style.panelContentQuoteTrend,
              )}
            >
              {isTrendTabActive ? (
                <div className={style.flatControlRow}>
                  <InsightButton
                    accentRgb={analysisContent.insightAccentRgb}
                    ariaLabel={`Open ${activeTabConfig.label.toLowerCase()} insights`}
                    className={style.controlInsightAction}
                    onClick={() => setIsAnalysisOpen(true)}
                    title={`View ${activeTabConfig.label} insights`}
                  />
                </div>
              ) : (
                <div className={style.panelHeader}>
                  <div className={style.panelIntro}>
                    <div className={`innerCardTitle ${style.panelTitle}`}>
                      {activePanelTitle}
                    </div>
                    <p className={style.subtitle}>{activeTabConfig.subtitle}</p>
                  </div>

                  <InsightButton
                    accentRgb={analysisContent.insightAccentRgb}
                    ariaLabel={`Open ${activeTabConfig.label.toLowerCase()} insights`}
                    onClick={() => setIsAnalysisOpen(true)}
                    title={`View ${activeTabConfig.label} insights`}
                  />
                </div>
              )}

              {cardVisualContent}
            </div>
          </section>
        </div>
      </Card>

      <AnalysisLayer
        activeAnalysisAlerts={analysisContent.activeAnalysisAlerts}
        activeAnalysisSummary={analysisContent.activeAnalysisSummary}
        activePanelTitle={activePanelTitle}
        activeTab={activeTab}
        activeTabConfig={activeTabConfig}
        analysisSpotlightGraphic={analysisSpotlightGraphic}
        analysisSpotlightLabel={analysisContent.analysisSpotlightLabel}
        analysisSpotlightMeta={analysisContent.analysisSpotlightMeta}
        analysisSpotlightValue={analysisContent.analysisSpotlightValue}
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
      >
        {analysisVisualContent}
      </AnalysisLayer>
    </>
  );
};

export default QuotePerformance;
