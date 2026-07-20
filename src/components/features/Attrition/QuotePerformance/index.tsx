import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  FaArrowTrendDown,
  FaArrowTrendUp,
  FaEllipsis,
  FaMinus,
} from "react-icons/fa6";
import Card from "../../../ui/card/Card";
import InsightButton from "../../../ui/insight_button";
import {
  type QuotePerformanceCardData,
  type QuotePerformanceTabData,
} from "../data";
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
import segmentedTabsStyle from "../../../ui/segmented_tabs/SegmentedTabs.module.css";
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

const quotePerformanceTabPriority: QuoteCardTabKey[] = [
  "cumulative-trend",
  "quote-trend",
  "conversion-trend",
  "brand-contribution",
  "pet-type-mix",
];

const MAX_VISIBLE_TAB_COUNT = 3;
const FIXED_VISIBLE_TAB_COUNT = MAX_VISIBLE_TAB_COUNT - 1;

const getQuotePerformanceTabPriority = (key: QuoteCardTabKey) => {
  const priorityIndex = quotePerformanceTabPriority.indexOf(key);
  return priorityIndex === -1 ? quotePerformanceTabPriority.length : priorityIndex;
};

const orderQuotePerformanceTabs = (
  tabs: readonly QuotePerformanceTabData[],
): QuotePerformanceTabData[] =>
  [...tabs].sort(
    (left, right) =>
      getQuotePerformanceTabPriority(left.key) -
      getQuotePerformanceTabPriority(right.key),
  );

const getFixedVisibleTabKeys = (
  tabs: readonly QuotePerformanceTabData[],
): QuoteCardTabKey[] =>
  tabs.slice(0, FIXED_VISIBLE_TAB_COUNT).map(({ key }) => key);

const resolveFloatingTabKey = (
  tabs: readonly QuotePerformanceTabData[],
  floatingTabKey: QuoteCardTabKey | null,
): QuoteCardTabKey | null => {
  const fixedKeys = new Set(getFixedVisibleTabKeys(tabs));
  const remainingTabs = tabs.filter(({ key }) => !fixedKeys.has(key));

  if (!remainingTabs.length) {
    return null;
  }

  return remainingTabs.some(({ key }) => key === floatingTabKey)
    ? floatingTabKey
    : remainingTabs[0].key;
};

const buildVisibleTabs = (
  tabs: readonly QuotePerformanceTabData[],
  floatingTabKey: QuoteCardTabKey | null,
): QuotePerformanceTabData[] => {
  const fixedKeys = new Set(getFixedVisibleTabKeys(tabs));
  const resolvedFloatingTabKey = resolveFloatingTabKey(tabs, floatingTabKey);

  return tabs
    .filter(
      ({ key }) => fixedKeys.has(key) || key === resolvedFloatingTabKey,
    )
    .slice(0, MAX_VISIBLE_TAB_COUNT);
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
  const [floatingTabKey, setFloatingTabKey] = useState<QuoteCardTabKey | null>(
    "conversion-trend",
  );
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const tabMenuRef = useRef<HTMLDivElement | null>(null);
  const metricDescriptor = getMetricViewDescriptor(
    activeTrendSeriesKey,
    metricViewVariant,
  );
  const trendSeriesOptions = getTrendSeriesOptions(metricViewVariant);
  const activeMetricView = data?.[activeTrendSeriesKey];
  const orderedTabs = orderQuotePerformanceTabs(activeMetricView?.tabs ?? []);
  const visibleTabs = buildVisibleTabs(orderedTabs, floatingTabKey);
  const overflowTabs = orderedTabs.filter(
    ({ key }) => !visibleTabs.some((visibleTab) => visibleTab.key === key),
  );
  const activeTabData =
    orderedTabs.find((tab) => tab.key === activeTab) ?? visibleTabs[0] ?? orderedTabs[0];

  useEffect(() => {
    const resolvedFloatingTabKey = resolveFloatingTabKey(orderedTabs, floatingTabKey);

    if (resolvedFloatingTabKey !== floatingTabKey) {
      setFloatingTabKey(resolvedFloatingTabKey);
    }
  }, [floatingTabKey, orderedTabs]);

  useEffect(() => {
    if (!orderedTabs.length) {
      return;
    }

    const fallbackTabKey = visibleTabs[0]?.key ?? orderedTabs[0]?.key;

    if (
      fallbackTabKey &&
      !visibleTabs.some(({ key }) => key === activeTab)
    ) {
      setActiveTab(fallbackTabKey);
    }
  }, [activeTab, orderedTabs, visibleTabs]);

  useEffect(() => {
    if (!isTabMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!tabMenuRef.current?.contains(event.target as Node)) {
        setIsTabMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTabMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTabMenuOpen]);

  useEffect(() => {
    if (!overflowTabs.length && isTabMenuOpen) {
      setIsTabMenuOpen(false);
    }
  }, [isTabMenuOpen, overflowTabs.length]);

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
  const tabControlStyle = activeTabData.accentRgb
    ? ({ "--segmented-accent-rgb": activeTabData.accentRgb } as CSSProperties)
    : undefined;

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

          <div className={style.tabControlRow} style={tabControlStyle}>
            <div
              aria-label="Quote performance views"
              className={joinClassNames(
                segmentedTabsStyle.root,
                style.tabControlTabs,
              )}
              role="tablist"
            >
              {visibleTabs.map((tab) => {
                const isActive = tab.key === activeTab;

                return (
                  <button
                    aria-controls={`quote-panel-${tab.key}`}
                    aria-selected={isActive}
                    className={joinClassNames(
                      segmentedTabsStyle.button,
                      isActive && segmentedTabsStyle.buttonActive,
                    )}
                    id={`quote-tab-${tab.key}`}
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setIsTabMenuOpen(false);
                    }}
                    role="tab"
                    type="button"
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {overflowTabs.length ? (
              <div className={style.tabOverflowRoot} ref={tabMenuRef}>
                <button
                  aria-expanded={isTabMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Show more quote performance views"
                  className={joinClassNames(
                    segmentedTabsStyle.button,
                    style.tabOverflowButton,
                    isTabMenuOpen && style.tabOverflowButtonOpen,
                  )}
                  onClick={() => setIsTabMenuOpen((value) => !value)}
                  type="button"
                >
                  <FaEllipsis aria-hidden="true" className={style.tabOverflowIcon} />
                </button>

                {isTabMenuOpen ? (
                  <div className={style.tabOverflowMenu} role="menu">
                    {overflowTabs.map((tab) => (
                      <button
                        className={style.tabOverflowItem}
                        key={tab.key}
                        onClick={() => {
                          setFloatingTabKey(tab.key);
                          setActiveTab(tab.key);
                          setIsTabMenuOpen(false);
                        }}
                        role="menuitem"
                        type="button"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

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

