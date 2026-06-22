import { useState } from "react";
import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaMinus,
} from "react-icons/fa6";
import Card from "../../../ui/card/Card";
import InsightButton from "../../../ui/insight_button";
import { type QuotePerformanceCardData } from "../data";
import {
  getMetricViewDescriptor,
  type MetricViewVariant,
} from "../metricView";
import type { AttritionComponentProps } from "../type";
import AnalysisLayer from "./AnalysisLayer";
import { getTrendSeriesOptions } from "./config";
import { joinClassNames } from "./helpers";
import type {
  QuoteCardTabKey,
  Tone,
  TrendSeriesKey,
} from "./types";
import {
  BrandContributionVisual,
  CumulativeTrendVisual,
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
  data?: QuotePerformanceCardData;
  metricViewVariant?: MetricViewVariant;
  onTrendSeriesChange: (key: TrendSeriesKey) => void;
}

const QuotePerformance: React.FC<QuotePerformanceProps> = ({
  activeTrendSeriesKey,
  className,
  data,
  metricViewVariant = "quote",
  onTrendSeriesChange,
}) => {
  const [activeTab, setActiveTab] = useState<QuoteCardTabKey>("quote-trend");
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const metricDescriptor = getMetricViewDescriptor(
    activeTrendSeriesKey,
    metricViewVariant,
  );
  const trendSeriesOptions = getTrendSeriesOptions(metricViewVariant);
  const activeMetricView = data?.[activeTrendSeriesKey];
  const tabs = activeMetricView?.tabs ?? [];
  const activeTabData = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];

  if (!activeTabData) {
    return null;
  }

  const isTrendTabActive =
    activeTabData.kind === "quote-trend" ||
    activeTabData.kind === "cumulative-trend" ||
    activeTabData.kind === "conversion-trend";
  const signalClassName = joinClassNames(
    style.signal,
    toneClassMap[activeTabData.signal.tone],
  );
  const analysisSpotlightToneClass =
    analysisToneClassMap[activeTabData.analysis.analysisSpotlightTone];
  const ChangeIcon =
    activeTabData.signal.direction === "up"
      ? FaArrowTrendUp
      : activeTabData.signal.direction === "down"
        ? FaArrowTrendDown
        : FaMinus;
  const activeTrendSeries =
    activeTabData.kind === "quote-trend"
      ? trendSeriesOptions.find(
          (series) => series.key === activeTabData.trendSeriesKey,
        ) ?? trendSeriesOptions[0]
      : activeTabData.kind === "cumulative-trend"
        ? trendSeriesOptions.find((series) => series.key === activeTrendSeriesKey) ??
          trendSeriesOptions[0]
        : trendSeriesOptions.find((series) => series.key === "conversionRate") ??
          trendSeriesOptions[0];

  const signalContent =
    activeTabData.signal.kind === "trend" ? (
      <div
        aria-label={activeTabData.signal.ariaLabel}
        className={signalClassName}
      >
        <span className={style.signalLabel}>{activeTabData.signal.label}</span>
        <div className={style.signalValueRow}>
          <ChangeIcon aria-hidden="true" className={style.signalIcon} />
          <strong className={style.signalValue}>{activeTabData.signal.value}</strong>
        </div>
      </div>
    ) : (
      <div
        aria-label={activeTabData.signal.ariaLabel}
        className={signalClassName}
      >
        <span className={style.signalLabel}>{activeTabData.signal.label}</span>
        <div className={style.signalValueRow}>
          <span aria-hidden="true" className={style.signalDot} />
          <strong className={style.signalValue}>{activeTabData.signal.value}</strong>
        </div>
      </div>
    );

  const cardVisualContent =
    activeTabData.kind === "quote-trend" ? (
      <QuoteTrendVisual
        activeTrendSeries={activeTrendSeries}
        activeTrendSeriesKey={activeTabData.trendSeriesKey}
        expanded={false}
        metricsTableData={activeTabData.metricsTable}
        onTrendSeriesChange={onTrendSeriesChange}
        showSeriesSelector={false}
        trendData={activeTabData.trendData}
      />
    ) : activeTabData.kind === "conversion-trend" ? (
      <ConversionTrendVisual
        expanded={false}
        metricsTableData={activeTabData.metricsTable}
        trendData={activeTabData.trendData}
      />
    ) : activeTabData.kind === "cumulative-trend" ? (
      <CumulativeTrendVisual
        expanded={false}
        metricsTableData={activeTabData.metricsTable}
        trendData={activeTabData.trendData}
        valueSuffix={activeTrendSeriesKey === "conversionRate" ? "%" : ""}
        yAxisWidth={activeTabData.yAxisWidth}
      />
    ) : activeTabData.kind === "brand-contribution" ? (
      <BrandContributionVisual
        data={activeTabData.brandData}
        expanded={false}
        metricViewVariant={metricViewVariant}
      />
    ) : (
      <PetTypeMixVisual
        data={activeTabData.petTypeData}
        expanded={false}
        metricViewVariant={metricViewVariant}
        totalQuote={activeTabData.totalQuote}
      />
    );

  const analysisVisualContent =
    activeTabData.kind === "quote-trend" ? (
      <QuoteTrendVisual
        activeTrendSeries={activeTrendSeries}
        activeTrendSeriesKey={activeTabData.trendSeriesKey}
        expanded
        metricsTableData={activeTabData.metricsTable}
        onTrendSeriesChange={onTrendSeriesChange}
        showSeriesSelector={false}
        trendData={activeTabData.trendData}
      />
    ) : activeTabData.kind === "conversion-trend" ? (
      <ConversionTrendVisual
        expanded
        metricsTableData={activeTabData.metricsTable}
        trendData={activeTabData.trendData}
      />
    ) : activeTabData.kind === "cumulative-trend" ? (
      <CumulativeTrendVisual
        expanded
        metricsTableData={activeTabData.metricsTable}
        trendData={activeTabData.trendData}
        valueSuffix={activeTrendSeriesKey === "conversionRate" ? "%" : ""}
        yAxisWidth={activeTabData.yAxisWidth}
      />
    ) : activeTabData.kind === "brand-contribution" ? (
      <BrandContributionVisual
        data={activeTabData.brandData}
        expanded
        metricViewVariant={metricViewVariant}
      />
    ) : (
      <PetTypeMixVisual
        data={activeTabData.petTypeData}
        expanded
        metricViewVariant={metricViewVariant}
        totalQuote={activeTabData.totalQuote}
      />
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
              {activeTabData.kind === "quote-trend"
                ? metricDescriptor.performanceTitle
                : activeTabData.title}
            </div>
            {signalContent}
          </div>

          <SegmentedTabs
            accentRgb={activeTabData.accentRgb}
            activeKey={activeTab}
            ariaLabel="Quote performance views"
            idBase="quote"
            onChange={(key) => setActiveTab(key as QuoteCardTabKey)}
            options={tabs.map(({ key, label }) => ({ key, label }))}
          />

          <section
            aria-labelledby={`quote-tab-${activeTabData.key}`}
            className={joinClassNames(
              style.panelBody,
              isTrendTabActive && style.panelBodyQuoteTrend,
            )}
            id={`quote-panel-${activeTabData.key}`}
            key={activeTabData.key}
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
                    accentRgb={activeTabData.analysis.insightAccentRgb}
                    ariaLabel={`Open ${activeTabData.label.toLowerCase()} insights`}
                    className={style.controlInsightAction}
                    onClick={() => setIsAnalysisOpen(true)}
                    title={`View ${activeTabData.label} insights`}
                  />
                </div>
              ) : (
                <div className={style.panelHeader}>
                  <div className={style.panelIntro}>
                    <div className={`innerCardTitle ${style.panelTitle}`}>
                      {activeTabData.panelTitle}
                    </div>
                    <p className={style.subtitle}>{activeTabData.subtitle}</p>
                  </div>

                  <InsightButton
                    accentRgb={activeTabData.analysis.insightAccentRgb}
                    ariaLabel={`Open ${activeTabData.label.toLowerCase()} insights`}
                    onClick={() => setIsAnalysisOpen(true)}
                    title={`View ${activeTabData.label} insights`}
                  />
                </div>
              )}

              {cardVisualContent}
            </div>
          </section>
        </div>
      </Card>

      <AnalysisLayer
        activeAnalysisAlerts={activeTabData.analysis.activeAnalysisAlerts}
        activeAnalysisSummary={activeTabData.analysis.activeAnalysisSummary}
        activePanelTitle={activeTabData.panelTitle}
        activeTab={activeTabData.key}
        activeTabConfig={{
          key: activeTabData.key,
          label: activeTabData.label,
          subtitle: activeTabData.subtitle,
          title: activeTabData.title,
        }}
        analysisSpotlightGraphic={analysisSpotlightGraphic}
        analysisSpotlightLabel={activeTabData.analysis.analysisSpotlightLabel}
        analysisSpotlightMeta={activeTabData.analysis.analysisSpotlightMeta}
        analysisSpotlightValue={activeTabData.analysis.analysisSpotlightValue}
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
      >
        {analysisVisualContent}
      </AnalysisLayer>
    </>
  );
};

export default QuotePerformance;
