import {
  type BrandContributionDatum,
  type PetTypeMixDatum,
  type QuoteTrendDatum,
} from "../data";
import {
  formatCount,
  formatDeltaPercent,
  formatPercent,
  formatPointGap,
} from "./helpers";
import type {
  AnalysisContent,
  Direction,
  QuoteCardTabKey,
  TrendSeriesOption,
} from "./types";

interface BuildAnalysisContentArgs {
  activeTab: QuoteCardTabKey;
  activeTrendSeries: TrendSeriesOption;
  brandContributionData: BrandContributionDatum[];
  changeDirection: Direction;
  currentMonth: QuoteTrendDatum;
  petTypeMixData: PetTypeMixDatum[];
  percentChange: number;
}

export const buildAnalysisContent = ({
  activeTab,
  activeTrendSeries,
  brandContributionData,
  changeDirection,
  currentMonth,
  petTypeMixData,
  percentChange,
}: BuildAnalysisContentArgs): AnalysisContent => {
  const brandContributionRanked = [...brandContributionData].sort(
    (left, right) => right.quoteCount - left.quoteCount,
  );
  const petTypeMixRanked = [...petTypeMixData].sort(
    (left, right) => right.quoteCount - left.quoteCount,
  );
  const leadBrandContribution = brandContributionRanked[0];
  const leadPetTypeMix = petTypeMixRanked[0];
  const topTwoPetTypeShare = Number(
    petTypeMixRanked
      .slice(0, 2)
      .reduce((sum, entry) => sum + entry.share, 0)
      .toFixed(1),
  );
  const brandHeadPair = brandContributionRanked.slice(0, 2);
  const brandMiddlePair = brandContributionRanked.slice(2, 4);
  const trailingBrandPair = brandContributionRanked.slice(-2);
  const nichePetTypeMix = petTypeMixRanked.slice(2, 4);
  const trailingPetTypeMix = petTypeMixRanked.slice(-3);
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
  const quoteSalesGap = Math.max(
    currentMonth.totalQuote - currentMonth.totalSales,
    0,
  );
  const conversionPointGap = Number(
    (
      currentMonth.conversionRate - currentMonth.previousYearConversionRate
    ).toFixed(1),
  );
  const isTrendAnalysis =
    activeTab === "quote-trend" || activeTab === "conversion-trend";

  const quoteTrendAlerts = [
    {
      id: "quote-yoy-trend",
      severity:
        changeDirection === "down"
          ? "high"
          : changeDirection === "flat"
            ? "medium"
            : "low",
      text: `${currentMonth.month} ${activeTrendSeries.label.toLowerCase()} is ${activeTrendSeries.valueFormatter(currentMonth[activeTrendSeries.key] as number)} versus ${activeTrendSeries.valueFormatter(currentMonth[activeTrendSeries.previousYearKey] as number)} in ${currentMonth.previousYearMonth}, a ${formatDeltaPercent(percentChange)} YoY ${changeDirection === "flat" ? "hold" : changeDirection}.`,
      tone: "trend",
    },
    {
      id: "quote-funnel-exception",
      severity: quoteSalesGap > currentMonth.totalSales ? "medium" : "low",
      text: `${formatCount(currentMonth.totalSales)} sales closed from ${formatCount(currentMonth.totalQuote)} quotes, leaving ${formatCount(quoteSalesGap)} quotes still outside closed sales and worth watching in the active funnel.`,
      tone: "exception",
    },
    {
      id: "quote-conversion-risk",
      severity: conversionPointGap < 0 ? "high" : "medium",
      text: `Conversion is ${conversionPointGap >= 0 ? "ahead of" : "below"} last year by ${formatPointGap(conversionPointGap)} at ${formatPercent(currentMonth.conversionRate)} versus ${formatPercent(currentMonth.previousYearConversionRate)}, so close-rate pressure should stay on the watchlist.`,
      tone: "risk",
    },
  ] as const;

  const brandAlerts = [
    {
      id: "brand-core-risk",
      severity: "high",
      text: `${brandHeadPair[0]?.brand ?? "Top brands"} and ${brandHeadPair[1]?.brand ?? "second brand"} account for ${formatPercent(brandHeadShare)} of brand quote volume, so pipeline health is still highly concentrated in two brands.`,
      tone: "risk",
    },
    {
      id: "brand-mid-trend",
      severity: "medium",
      text: `${brandMiddlePair[0]?.brand ?? "Mid-tier brands"} and ${brandMiddlePair[1]?.brand ?? "support brands"} contribute ${formatPercent(brandMiddleShare)} combined, which gives the portfolio a meaningful mid-tier support layer beyond the leaders.`,
      tone: "trend",
    },
    {
      id: "brand-niche-exception",
      severity: "low",
      text: `${trailingBrandPair[0]?.brand ?? "Niche brands"} and ${trailingBrandPair[1]?.brand ?? "tail brands"} make up ${formatPercent(trailingBrandShare)} together. They should be tracked as niche exceptions rather than judged against core-brand volume targets.`,
      tone: "exception",
    },
  ] as const;

  const petMixAlerts = [
    {
      id: "petmix-core-trend",
      severity: "medium",
      text: `Dogs and Cats still anchor ${formatPercent(topTwoPetTypeShare)} of the mix, so the book continues to lean on the core pet categories for stable volume.`,
      tone: "trend",
    },
    {
      id: "petmix-niche-exception",
      severity: "low",
      text: `${nichePetTypeMix[0]?.petType ?? "Niche segments"} and ${nichePetTypeMix[1]?.petType ?? "support segments"} already represent ${formatPercent(nichePetTypeShare)} combined, which is large enough to merit distinct messaging instead of being treated as residual traffic.`,
      tone: "exception",
    },
    {
      id: "petmix-longtail-risk",
      severity: "high",
      text: `The smallest three mix segments total ${formatPercent(trailingPetTypeShare)}. That long tail can swing quickly month to month, so quote quality there should be monitored separately from the core mix.`,
      tone: "risk",
    },
  ] as const;

  const activeAnalysisAlerts =
    isTrendAnalysis
      ? [...quoteTrendAlerts]
      : activeTab === "brand-contribution"
        ? [...brandAlerts]
        : [...petMixAlerts];

  const activeAnalysisSummary =
    activeTab === "conversion-trend"
      ? [
          `${formatPercent(currentMonth.conversionRate)} current`,
          `${formatPercent(currentMonth.previousYearConversionRate)} last year`,
          `${formatPointGap(conversionPointGap)} gap`,
        ]
      : activeTab === "quote-trend"
      ? [
          `YoY ${formatDeltaPercent(percentChange)}`,
          `${formatCount(currentMonth.totalQuote)} quotes`,
          `${formatPercent(currentMonth.conversionRate)} conversion`,
        ]
      : activeTab === "brand-contribution"
        ? [
            `${leadBrandContribution?.brand ?? "Lead brand"} leads`,
            `${formatCount(leadBrandContribution?.quoteCount ?? 0)} quotes`,
            `${formatPercent(leadBrandContribution?.share ?? 0)} share`,
          ]
        : [
            `${leadPetTypeMix?.petType ?? "Lead segment"} leads`,
            `${formatCount(leadPetTypeMix?.quoteCount ?? 0)} quotes`,
            `${formatPercent(leadPetTypeMix?.share ?? 0)} mix`,
          ];

  const insightAccentRgb =
    isTrendAnalysis
      ? activeTrendSeries.key === "totalSales"
        ? "51, 177, 139"
        : activeTrendSeries.key === "conversionRate"
          ? "78, 141, 245"
          : "201, 106, 61"
      : activeTab === "brand-contribution"
        ? "212, 117, 88"
        : "78, 141, 245";

  return {
    activeAnalysisAlerts,
    activeAnalysisSummary,
    analysisSpotlightLabel:
      activeTab === "conversion-trend"
        ? "Point Gap"
        : activeTab === "quote-trend"
        ? "YoY Signal"
        : activeTab === "brand-contribution"
          ? "Lead Brand"
          : "Highest Contributor",
    analysisSpotlightMeta:
      activeTab === "conversion-trend"
        ? `${currentMonth.month} conversion at ${formatPercent(currentMonth.conversionRate)} versus ${formatPercent(currentMonth.previousYearConversionRate)} in ${currentMonth.previousYearMonth}`
        : activeTab === "quote-trend"
        ? `${activeTrendSeries.label} for ${currentMonth.month} vs ${currentMonth.previousYearMonth}`
        : activeTab === "brand-contribution"
          ? `${formatCount(leadBrandContribution?.quoteCount ?? 0)} quotes | ${formatPercent(leadBrandContribution?.share ?? 0)} share`
          : `${formatCount(leadPetTypeMix?.quoteCount ?? 0)} quotes | ${formatPercent(leadPetTypeMix?.share ?? 0)} mix`,
    analysisSpotlightTone:
      isTrendAnalysis
        ? changeDirection === "up"
          ? "positive"
          : changeDirection === "down"
            ? "negative"
            : "neutral"
        : activeTab === "brand-contribution"
          ? "warm"
          : "cool",
    analysisSpotlightValue:
      activeTab === "conversion-trend"
        ? formatPointGap(conversionPointGap)
        : activeTab === "quote-trend"
        ? formatDeltaPercent(percentChange)
        : activeTab === "brand-contribution"
          ? leadBrandContribution?.brand ?? ""
          : leadPetTypeMix?.petType ?? "",
    insightAccentRgb,
  };
};
