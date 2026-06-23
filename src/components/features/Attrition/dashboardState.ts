import {
  agentPerformanceData as baseAgentPerformanceData,
  brandContributionData as baseBrandContributionData,
  brandContributionTotalQuotes,
  type BrandContributionDatum,
  type CumulativeTrendDatum,
  type DashboardInsightDatum,
  type LapsedQuoteBucketDatum,
  type LapsedQuoteChartDatum,
  lapsedQuoteByCountryData as baseLapsedQuoteByCountryData,
  type MetricDisplayRow,
  pendingQuoteByCountryData as basePendingQuoteByCountryData,
  petTypeMixData as basePetTypeMixData,
  petTypeMixTotalQuotes,
  premiumChannelSplitData as basePremiumChannelSplitData,
  premiumCurrencyOptions,
  productPerformanceData as baseProductPerformanceData,
  promoCodePerformanceData as basePromoCodePerformanceData,
  quoteByCountryData as baseQuoteByCountryData,
  trendData as baseTrendData,
  type PendingQuoteByCountryDatum,
  type PetTypeMixDatum,
  type PremiumOverviewCardData,
  type PremiumChannelSplitDatum,
  type PremiumCurrencyCode,
  type ProductPerformanceCardData,
  type ProductPerformanceRowData,
  type ProductPerformanceViewData,
  type PromoPerformanceTableRow,
  type PromoPerformanceViewData,
  type QuoteByPromoCodeCardData,
  type QuoteAgingByCountryDatum,
  type QuoteByCountryCardData,
  type QuoteByCountryDatum,
  type QuoteByCountryViewData,
  type QuoteByCountryViewRow,
  type QuoteMetricCellData,
  type QuoteMetricTableData,
  type QuoteMetricTableRowData,
  type QuotePerformanceCardData,
  type QuotePerformanceAnalysisData,
  type QuotePerformanceMetricViewData,
  type QuotePerformanceSignalData,
  type QuotePerformanceTabData,
  type QuoteTrendDatum,
  type QuoteWorkflowCardData,
  type QuoteWorkflowTabKey,
  type WorkflowBarChartDatum,
  type WorkflowReasonTableRow,
} from "./data";
import {
  getMetricViewDescriptor,
  type MetricViewVariant,
} from "./metricView";
import {
  getTrendSeriesOptions,
  quoteCardTabs,
  trendSeriesOptions,
} from "./QuotePerformance/config";
import {
  formatDeltaPercent,
  formatPointGap,
  readTrendMetric,
} from "./QuotePerformance/helpers";
import { buildAnalysisContent } from "./QuotePerformance/insights";
import type { TrendSeriesKey } from "./QuotePerformance/types";
import { formatCompactCurrency } from "../../../utils/formatters";

export interface QuoteDashboardFilters {
  brands: string[];
  countries: string[];
  petTypes: string[];
}

export interface QuoteDashboardDataBundle {
  premiumOverviewData: PremiumOverviewCardData;
  productPerformanceData: ProductPerformanceCardData;
  promoCodePerformanceData: QuoteByPromoCodeCardData;
  quoteByCountryData: QuoteByCountryCardData;
  quotePerformanceData: QuotePerformanceCardData;
  quoteWorkflowData: QuoteWorkflowCardData;
}

export interface SelectionOption<T extends string> {
  label: string;
  value: T;
}

export const countryFilterOptions: SelectionOption<string>[] =
  baseQuoteByCountryData.map((row) => ({
    label: row.country,
    value: row.country,
  }));

export const brandFilterOptions: SelectionOption<string>[] =
  baseBrandContributionData.map((row) => ({
    label: row.brand,
    value: row.brand,
  }));

export const petTypeFilterOptions: SelectionOption<string>[] =
  basePetTypeMixData.map((row) => ({
    label: row.petType,
    value: row.petType,
  }));

export const currencyFilterOptions: SelectionOption<PremiumCurrencyCode>[] =
  premiumCurrencyOptions.map((option) => ({
    label: option.label,
    value: option.code,
  }));

const buildMetricFilterOptions = (
  variant: MetricViewVariant,
): SelectionOption<TrendSeriesKey>[] =>
  trendSeriesOptions.map((option) => ({
    label: getMetricViewDescriptor(option.key, variant).buttonLabel,
    value: option.key,
  }));

export const metricFilterOptions = buildMetricFilterOptions("quote");
export const policyMetricFilterOptions = buildMetricFilterOptions("policy");

const calculateConversionRate = (totalSales: number, totalQuote: number) =>
  totalQuote === 0 ? 0 : Number(((totalSales / totalQuote) * 100).toFixed(1));

const calculateShare = (value: number, total: number) =>
  total === 0 ? 0 : Number(((value / total) * 100).toFixed(1));

const formatCount = (value: number) => value.toLocaleString();

const formatPercent = (value: number) => `${value}%`;

const averageActiveFactors = (factors: Array<number | null>) => {
  const activeFactors = factors.filter(
    (factor): factor is number => factor !== null,
  );

  if (!activeFactors.length) {
    return 1;
  }

  return Number(
    (
      activeFactors.reduce((sum, factor) => sum + factor, 0) /
      activeFactors.length
    ).toFixed(4),
  );
};

const scaleCount = (value: number, factor: number) =>
  value === 0 ? 0 : Math.max(1, Math.round(value * factor));

const scaleAmount = (value: number, factor: number) => Math.round(value * factor);

const buildFactorMap = <T extends string>(
  rows: ReadonlyArray<{ key: T; weight: number }>,
) =>
  rows.reduce(
    (map, row) => map.set(row.key, row.weight),
    new Map<T, number>(),
  );

const countryWeightMap = buildFactorMap(
  baseQuoteByCountryData.map((row) => ({
    key: row.country,
    weight: row.totalQuote,
  })),
);

const brandWeightMap = buildFactorMap(
  baseBrandContributionData.map((row) => ({
    key: row.brand,
    weight: row.quoteCount,
  })),
);

const petWeightMap = buildFactorMap(
  basePetTypeMixData.map((row) => ({
    key: row.petType,
    weight: row.quoteCount,
  })),
);

const resolveSelectedFactor = (
  selectedValues: string[],
  weightMap: Map<string, number>,
  totalWeight: number,
) => {
  if (!selectedValues.length) {
    return null;
  }

  const selectedWeight = selectedValues.reduce(
    (sum, value) => sum + (weightMap.get(value) ?? 0),
    0,
  );

  return Number((selectedWeight / Math.max(totalWeight, 1)).toFixed(4));
};

const rebuildCountryData = (
  rows: QuoteByCountryDatum[],
  scaleFactor: number,
): QuoteByCountryDatum[] => {
  const scaledRows = rows.map((row) => ({
    ...row,
    totalSales: scaleCount(row.totalSales, scaleFactor),
    totalQuote: scaleCount(row.totalQuote, scaleFactor),
  }));
  const totalQuote = scaledRows.reduce((sum, row) => sum + row.totalQuote, 0);
  const totalSales = scaledRows.reduce((sum, row) => sum + row.totalSales, 0);

  return scaledRows.map((row) => ({
    ...row,
    conversionRate: calculateConversionRate(row.totalSales, row.totalQuote),
    quoteShare: calculateShare(row.totalQuote, totalQuote),
    salesShare: calculateShare(row.totalSales, totalSales),
  }));
};

const joinCountryCodes = (rows: QuoteByCountryViewRow[]) =>
  rows.map((row) => row.countryCode).join(", ");

const buildQuoteByCountryView = (
  rows: QuoteByCountryDatum[],
  metricKey: "conversionRate" | "totalQuote" | "totalSales",
): QuoteByCountryViewData => {
  const tableRows: QuoteByCountryViewRow[] = rows.map((row) => {
    const metricValue =
      metricKey === "conversionRate"
        ? row.conversionRate
        : metricKey === "totalSales"
          ? row.totalSales
          : row.totalQuote;

    return {
      ...row,
      metricLabel:
        metricKey === "conversionRate"
          ? formatPercent(metricValue)
          : formatCount(metricValue),
      metricValue,
    };
  });

  if (!tableRows.length) {
    return {
      chartData: [],
      insights: [],
      tableRows: [],
    };
  }

  const metricSortedRows = [...tableRows].sort(
    (left, right) => right.metricValue - left.metricValue,
  );
  const quoteShareSortedRows = [...tableRows].sort(
    (left, right) => right.quoteShare - left.quoteShare,
  );
  const salesShareSortedRows = [...tableRows].sort(
    (left, right) => right.salesShare - left.salesShare,
  );
  const leader = metricSortedRows[0];
  const trailer = metricSortedRows[metricSortedRows.length - 1];
  const belowConversionThresholdRows = tableRows.filter(
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
      tableRows.reduce((sum, row) => sum + row.conversionRate, 0) /
      Math.max(tableRows.length, 1)
    ).toFixed(1),
  );
  const conversionSpread = Number(
    ((leader.conversionRate ?? 0) - (trailer.conversionRate ?? 0)).toFixed(1),
  );
  const underIndexRow = tableRows.reduce((current, row) => {
    const currentDelta = current.salesShare - current.quoteShare;
    const nextDelta = row.salesShare - row.quoteShare;

    return nextDelta < currentDelta ? row : current;
  }, tableRows[0]);

  return {
    chartData: tableRows,
    insights:
      metricKey === "conversionRate"
        ? [
            {
              id: "best-conversion",
              label: "Best Conversion",
              note: `${leader.countryCode} converts ${(leader.conversionRate - averageConversion).toFixed(1)} pts above the market average.`,
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
              tone:
                belowConversionThresholdRows.length > 0 ? "negative" : "positive",
              value:
                belowConversionThresholdRows.length > 0
                  ? `${belowConversionThresholdRows.length} markets below 2.5%`
                  : "No markets below 2.5%",
            },
          ]
        : metricKey === "totalSales"
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
                value: formatPercent(topTwoSalesShare),
              },
              {
                id: "converted-under-index",
                label: "Under-indexing",
                note: `${underIndexRow.countryCode} converts ${formatPercent(underIndexRow.salesShare)} of sales from ${formatPercent(underIndexRow.quoteShare)} of quotes.`,
                tone: "negative",
                value: `${underIndexRow.countryCode} ${(underIndexRow.salesShare - underIndexRow.quoteShare).toFixed(1)} pts`,
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
                value: formatPercent(topTwoQuoteShare),
              },
              {
                id: "quoted-watchlist",
                label: "Low Conversion",
                note: `${trailer.countryCode} has the weakest conversion against current quote volume.`,
                tone: "negative",
                value: `${trailer.countryCode} ${formatPercent(trailer.conversionRate)}`,
              },
            ],
    tableRows,
  };
};

const buildQuoteByCountryCardData = (
  rows: QuoteByCountryDatum[],
): QuoteByCountryCardData => ({
  conversionRate: buildQuoteByCountryView(rows, "conversionRate"),
  totalQuote: buildQuoteByCountryView(rows, "totalQuote"),
  totalSales: buildQuoteByCountryView(rows, "totalSales"),
});

const rebuildBrandData = (
  rows: BrandContributionDatum[],
  scaleFactor: number,
): BrandContributionDatum[] => {
  const scaledRows = rows.map((row) => ({
    ...row,
    quoteCount: scaleCount(row.quoteCount, scaleFactor),
  }));
  const totalQuote = scaledRows.reduce((sum, row) => sum + row.quoteCount, 0);

  return scaledRows.map((row) => {
    const share = calculateShare(row.quoteCount, totalQuote);

    return {
      ...row,
      share,
      shareLabel: `${share}%`,
    };
  });
};

const rebuildPetTypeData = (
  rows: PetTypeMixDatum[],
  scaleFactor: number,
): PetTypeMixDatum[] => {
  const scaledRows = rows.map((row) => ({
    ...row,
    quoteCount: scaleCount(row.quoteCount, scaleFactor),
  }));
  const totalQuote = scaledRows.reduce((sum, row) => sum + row.quoteCount, 0);

  return scaledRows.map((row) => {
    const share = calculateShare(row.quoteCount, totalQuote);

    return {
      ...row,
      share,
      shareLabel: `${share}%`,
    };
  });
};

const rebuildPremiumChannelData = (
  rows: PremiumChannelSplitDatum[],
  scaleFactor: number,
): PremiumChannelSplitDatum[] => {
  const scaledRows = rows.map((row) => ({
    ...row,
    totalPremium: scaleAmount(row.totalPremium, scaleFactor),
  }));
  const totalPremium = scaledRows.reduce((sum, row) => sum + row.totalPremium, 0);

  return scaledRows.map((row) => ({
    ...row,
    contribution: calculateShare(row.totalPremium, totalPremium),
  }));
};

const scaleTrendData = (rows: QuoteTrendDatum[], scaleFactor: number) =>
  rows.map((row) => {
    const totalQuote = scaleCount(row.totalQuote, scaleFactor);
    const totalSales = scaleCount(row.totalSales, scaleFactor);
    const previousYearTotalQuote = scaleCount(
      row.previousYearTotalQuote,
      scaleFactor,
    );
    const previousYearTotalSales = scaleCount(
      row.previousYearTotalSales,
      scaleFactor,
    );

    return {
      ...row,
      conversionRate: calculateConversionRate(totalSales, totalQuote),
      previousYearConversionRate: calculateConversionRate(
        previousYearTotalSales,
        previousYearTotalQuote,
      ),
      previousYearTotalQuote,
      previousYearTotalSales,
      totalQuote,
      totalSales,
    };
  });

const formatDays = (value: number) => `${value}d`;

const formatCurrency = (value: number) =>
  formatCompactCurrency(value, { currencySymbol: "\u00A3" });

const countryAbbreviationMap: Record<string, string> = {
  France: "FR",
  Germany: "DE",
  Ireland: "IE",
  Sweden: "SE",
  UK: "UK",
};

const getCountryCode = (country: string) =>
  countryAbbreviationMap[country] ?? country.slice(0, 2).toUpperCase();

const lapsedBucketData: LapsedQuoteBucketDatum[] = [
  {
    color: "#d7a13d",
    key: "bucket0To30",
    label: "0-30 Days",
  },
  {
    color: "#c46b43",
    key: "bucket31To60",
    label: "31-60 Days",
  },
  {
    color: "#C05A52",
    key: "bucket61To90",
    label: "61-90 Days",
  },
];

const channelVisuals: Record<
  PremiumChannelSplitDatum["channel"],
  { accentColor: string; accentGlowRgb: string }
> = {
  "Contact Center": {
    accentColor: "#6f8dff",
    accentGlowRgb: "111, 141, 255",
  },
  Web: {
    accentColor: "#58c89a",
    accentGlowRgb: "88, 200, 154",
  },
};

const allocateByShare = (
  total: number,
  channels: ReadonlyArray<PremiumChannelSplitDatum["channel"]>,
  shareMap: Map<PremiumChannelSplitDatum["channel"], number>,
) => {
  let remaining = total;

  return channels.reduce(
    (map, channel, index) => {
      const share = shareMap.get(channel) ?? 0;
      const allocated =
        index === channels.length - 1
          ? remaining
          : Math.max(0, Math.round((total * share) / 100));

      remaining -= allocated;
      map.set(channel, allocated);
      return map;
    },
    new Map<PremiumChannelSplitDatum["channel"], number>(),
  );
};

const buildPremiumOverviewCardData = (
  channels: PremiumChannelSplitDatum[],
  pendingRows: PendingQuoteByCountryDatum[],
  trendRows: QuoteTrendDatum[],
): PremiumOverviewCardData => {
  const orderedChannels = (["Web", "Contact Center"] as const).map(
    (channelName) =>
      channels.find((channel) => channel.channel === channelName) ?? {
        channel: channelName,
        contribution: 0,
        fill: channelVisuals[channelName].accentColor,
        totalPremium: 0,
      },
  );

  const shareMap = new Map(
    orderedChannels.map((channel) => [channel.channel, channel.contribution]),
  );
  const latestTrend = trendRows[trendRows.length - 1];
  const totalQuote = latestTrend?.totalQuote ?? 0;
  const overallConversionRate = latestTrend?.conversionRate ?? 0;
  const totalPendingQuotes = pendingRows.reduce(
    (sum, row) => sum + row.pendingQuotes,
    0,
  );
  const quoteAllocations = allocateByShare(
    totalQuote,
    ["Web", "Contact Center"],
    shareMap,
  );
  const pendingAllocations = allocateByShare(
    totalPendingQuotes,
    ["Web", "Contact Center"],
    shareMap,
  );

  return {
    sections: orderedChannels.map((channel) => {
      const rateBias = (channel.contribution - 50) / 60;
      const conversionRate = Math.max(
        0,
        Number((overallConversionRate + rateBias).toFixed(1)),
      );
      const metricRows: MetricDisplayRow[] = [
        {
          id: `${channel.channel}-conversion-rate`,
          label: "Conversion Rate",
          value: formatPercent(conversionRate),
        },
        {
          id: `${channel.channel}-pending-quotes`,
          label: "Pending Quotes",
          value: formatCount(pendingAllocations.get(channel.channel) ?? 0),
        },
        {
          id: `${channel.channel}-total-quote`,
          label: "Total Quote",
          value: formatCount(quoteAllocations.get(channel.channel) ?? 0),
        },
      ];

      return {
        ...channelVisuals[channel.channel],
        channel: channel.channel,
        metricRows,
        share: channel.contribution,
        shareLabel: formatPercent(channel.contribution),
      };
    }),
  };
};

const buildQuoteWorkflowCardData = (
  lapsedRows: QuoteAgingByCountryDatum[],
  pendingRows: PendingQuoteByCountryDatum[],
): QuoteWorkflowCardData => {
  const lapsedChartData: LapsedQuoteChartDatum[] = lapsedRows.map((row) => ({
    ...row,
    countryCode: getCountryCode(row.country),
    total: row.bucket0To30 + row.bucket31To60 + row.bucket61To90,
  }));
  const pendingChartData: WorkflowBarChartDatum[] = pendingRows.map((row) => ({
    country: row.country,
    countryCode: getCountryCode(row.country),
    fill: "#4e8df5",
    value: row.pendingQuotes,
    valueLabel: formatCount(row.pendingQuotes),
  }));
  const totalLapsed = lapsedChartData.reduce(
    (sum, row) => sum + row.total,
    0,
  );
  const lapsedRowsByTotal = [...lapsedChartData].sort(
    (left, right) => right.total - left.total,
  );
  const freshBucketTotal = lapsedChartData.reduce(
    (sum, row) => sum + row.bucket0To30,
    0,
  );
  const oldestMixRow = lapsedRowsByTotal.reduce<LapsedQuoteChartDatum | null>(
    (current, row) => {
      if (!current) {
        return row;
      }

      const currentLateShare =
        current.bucket61To90 / Math.max(current.total, 1);
      const nextLateShare = row.bucket61To90 / Math.max(row.total, 1);

      return nextLateShare > currentLateShare ? row : current;
    },
    null,
  );
  const topTwoLapsedTotal = lapsedRowsByTotal
    .slice(0, 2)
    .reduce((sum, row) => sum + row.total, 0);
  const lapsedInsights: DashboardInsightDatum[] = [
    {
      id: "recovery-window",
      label: "Recovery Window",
      note: `${formatPercent(Number(((freshBucketTotal / Math.max(totalLapsed, 1)) * 100).toFixed(1)))} of lapsed items are still inside 0-30 days.`,
      tone: "positive",
      value: formatPercent(
        Number(((freshBucketTotal / Math.max(totalLapsed, 1)) * 100).toFixed(1)),
      ),
    },
    {
      id: "top-two-load",
      label: "Top 2 Load",
      note: `${lapsedRowsByTotal[0]?.countryCode ?? ""} and ${lapsedRowsByTotal[1]?.countryCode ?? ""} account for most lapsed volume.`,
      tone: "neutral",
      value: formatPercent(
        Number(((topTwoLapsedTotal / Math.max(totalLapsed, 1)) * 100).toFixed(1)),
      ),
    },
    {
      id: "oldest-mix",
      label: "Oldest Mix",
      note: oldestMixRow
        ? `${oldestMixRow.countryCode} has the highest 61-90 day share in the lapsed book.`
        : "No lapsed aging data is available.",
      tone: "negative",
      value: oldestMixRow
        ? `${oldestMixRow.countryCode} ${formatPercent(
            Number(
              (
                (oldestMixRow.bucket61To90 / Math.max(oldestMixRow.total, 1)) *
                100
              ).toFixed(1),
            ),
          )}`
        : "No data",
    },
  ];
  const totalPending = pendingChartData.reduce(
    (sum, row) => sum + row.value,
    0,
  );
  const pendingRowsByTotal = [...pendingChartData].sort(
    (left, right) => right.value - left.value,
  );
  const pendingLeadRow = pendingRowsByTotal[0];
  const pendingTailRow = pendingRowsByTotal[pendingRowsByTotal.length - 1];
  const topTwoPendingTotal = pendingRowsByTotal
    .slice(0, 2)
    .reduce((sum, row) => sum + row.value, 0);
  const pendingInsights: DashboardInsightDatum[] = [
    {
      id: "lead-queue",
      label: "Lead Queue",
      note: pendingLeadRow
        ? `${pendingLeadRow.countryCode} holds ${formatPercent(
            Number(
              (
                (pendingLeadRow.value / Math.max(totalPending, 1)) *
                100
              ).toFixed(1),
            ),
          )} of pending intake.`
        : "No pending data is available.",
      tone: "neutral",
      value: pendingLeadRow
        ? `${pendingLeadRow.countryCode} ${formatCount(pendingLeadRow.value)}`
        : "No data",
    },
    {
      id: "top-two-pending",
      label: "Top 2 Load",
      note: `${pendingRowsByTotal[0]?.countryCode ?? ""} and ${pendingRowsByTotal[1]?.countryCode ?? ""} carry most pending intake.`,
      tone: "negative",
      value: formatPercent(
        Number(((topTwoPendingTotal / Math.max(totalPending, 1)) * 100).toFixed(1)),
      ),
    },
    {
      id: "lightest-queue",
      label: "Lightest Queue",
      note: pendingTailRow
        ? `${pendingTailRow.country} has the smallest pending workload in the current queue.`
        : "No pending data is available.",
      tone: "positive",
      value: pendingTailRow
        ? `${pendingTailRow.countryCode} ${formatCount(pendingTailRow.value)}`
        : "No data",
    },
  ];

  return {
    idBase: "quote-workflow",
    title: "Quote Workflow",
    tabs: [
      {
        accentRgb: "215, 161, 61",
        buckets: lapsedBucketData,
        chartData: lapsedChartData,
        insights: lapsedInsights,
        key: "lapsed-quotes",
        kind: "lapsed",
        label: "Lapsed",
        metricLabel: "Lapsed",
        subtitle: "Lapsed aged by country across the current bucket ranges.",
        tableRows: lapsedRows,
        title: "Lapsed",
      },
      {
        accentRgb: "78, 141, 245",
        chartData: pendingChartData,
        insights: pendingInsights,
        key: "pending-quotes",
        kind: "bar",
        label: "Pending",
        metricLabel: "Pending",
        subtitle: "Current pending queue by country.",
        title: "Pending by Country",
      },
    ],
  };
};

const scaleProductData = (
  rows: typeof baseProductPerformanceData,
  scaleFactor: number,
) =>
  rows.map((row) => ({
    ...row,
    convertedValue: scaleAmount(row.convertedValue, scaleFactor),
    convertedVolume: scaleCount(row.convertedVolume, scaleFactor),
    quotedValue: scaleAmount(row.quotedValue, scaleFactor),
    quotedVolume: scaleCount(row.quotedVolume, scaleFactor),
  }));

const scalePromoCodeData = (
  rows: typeof basePromoCodePerformanceData,
  scaleFactor: number,
) =>
  rows.map((row) => ({
    ...row,
    convertedVolume: scaleCount(row.convertedVolume, scaleFactor),
    quotedVolume: scaleCount(row.quotedVolume, scaleFactor),
  }));

const scaleAgentData = (
  rows: typeof baseAgentPerformanceData,
  scaleFactor: number,
) =>
  rows.map((row) => ({
    ...row,
    convertedVolume: scaleCount(row.convertedVolume, scaleFactor),
    quotedVolume: scaleCount(row.quotedVolume, scaleFactor),
  }));

const buildProductPerformanceViewData = (
  rows: ReturnType<typeof scaleProductData>,
  activeMetricKey: TrendSeriesKey,
  metricTab: "value" | "volume",
): ProductPerformanceViewData => {
  const metricDescriptor = getMetricViewDescriptor(activeMetricKey);
  const isVolumeTab = metricTab === "volume";
  const accentRgb = isVolumeTab ? "78, 141, 245" : "212, 117, 88";
  const totalQuotedMetric = rows.reduce(
    (sum, row) => sum + (isVolumeTab ? row.quotedVolume : row.quotedValue),
    0,
  );
  const totalConvertedMetric = rows.reduce(
    (sum, row) => sum + (isVolumeTab ? row.convertedVolume : row.convertedValue),
    0,
  );
  const title = isVolumeTab
    ? metricDescriptor.productVolumeTitle
    : metricDescriptor.productValueTitle;
  const metricTotal =
    activeMetricKey === "totalSales" ? totalConvertedMetric : totalQuotedMetric;
  const rankedRows = rows
    .map((row) => {
      const quotedMetric = isVolumeTab ? row.quotedVolume : row.quotedValue;
      const convertedMetric = isVolumeTab ? row.convertedVolume : row.convertedValue;

      if (activeMetricKey === "conversionRate") {
        const conversionRate = Number(
          ((convertedMetric / Math.max(quotedMetric, 1)) * 100).toFixed(1),
        );

        return {
          contributionValue: convertedMetric,
          metricDisplay: formatPercent(conversionRate),
          metricValue: conversionRate,
          metaDisplay: isVolumeTab
            ? `${formatCount(row.convertedVolume)} / ${formatCount(row.quotedVolume)}`
            : `${formatCurrency(row.convertedValue)} / ${formatCurrency(row.quotedValue)}`,
          product: row.product,
        };
      }

      const metricValue =
        activeMetricKey === "totalSales" ? convertedMetric : quotedMetric;
      const share = Number(
        ((metricValue / Math.max(metricTotal, 1)) * 100).toFixed(1),
      );

      return {
        contributionValue: metricValue,
        metricDisplay: isVolumeTab
          ? formatCount(metricValue)
          : formatCurrency(metricValue),
        metricValue,
        metaDisplay: `${share}%`,
        product: row.product,
      };
    })
    .sort((left, right) => right.metricValue - left.metricValue)
    .slice(0, 5);
  const contributionTotal =
    activeMetricKey === "totalQuote" ? totalQuotedMetric : totalConvertedMetric;
  const topFiveShare = Number(
    (
      (rankedRows.reduce((sum, row) => sum + row.contributionValue, 0) /
        Math.max(contributionTotal, 1)) *
      100
    ).toFixed(1),
  );
  const maxValue = rankedRows.reduce(
    (currentMax, row) => Math.max(currentMax, row.metricValue),
    0,
  );
  const displayRows: ProductPerformanceRowData[] = rankedRows.map(
    (row, index) => ({
      fillPercent:
        maxValue === 0 ? 0 : Number(((row.metricValue / maxValue) * 100).toFixed(1)),
      metaDisplay: row.metaDisplay,
      metricDisplay: row.metricDisplay,
      product: row.product,
      rankLabel: String(index + 1).padStart(2, "0"),
    }),
  );

  return {
    accentRgb,
    rows: displayRows,
    summaryValue: formatPercent(topFiveShare),
    title,
  };
};

const buildProductPerformanceCardData = (
  rows: ReturnType<typeof scaleProductData>,
): ProductPerformanceCardData => ({
  value: {
    conversionRate: buildProductPerformanceViewData(
      rows,
      "conversionRate",
      "value",
    ),
    totalQuote: buildProductPerformanceViewData(rows, "totalQuote", "value"),
    totalSales: buildProductPerformanceViewData(rows, "totalSales", "value"),
  },
  volume: {
    conversionRate: buildProductPerformanceViewData(
      rows,
      "conversionRate",
      "volume",
    ),
    totalQuote: buildProductPerformanceViewData(rows, "totalQuote", "volume"),
    totalSales: buildProductPerformanceViewData(rows, "totalSales", "volume"),
  },
});

const buildPromoPerformanceViewData = (
  sourceRows: Array<{
    averageTimeToConvertDays: number;
    convertedVolume: number;
    id: string;
    label: string;
    quotedVolume: number;
  }>,
  activeMetricKey: TrendSeriesKey,
  firstColumnHeader: string,
  title: string,
): PromoPerformanceViewData => {
  const totalQuotedVolume = sourceRows.reduce(
    (sum, row) => sum + row.quotedVolume,
    0,
  );
  const totalConvertedVolume = sourceRows.reduce(
    (sum, row) => sum + row.convertedVolume,
    0,
  );
  const sortedRows = sourceRows
    .map((row) => {
      const conversionRate = Number(
        ((row.convertedVolume / Math.max(row.quotedVolume, 1)) * 100).toFixed(1),
      );

      return {
        averageTimeToConvertDays: row.averageTimeToConvertDays,
        conversionRate,
        convertedShare: Number(
          ((row.convertedVolume / Math.max(totalConvertedVolume, 1)) * 100).toFixed(
            1,
          ),
        ),
        convertedVolume: row.convertedVolume,
        id: row.id,
        label: row.label,
        quotedShare: Number(
          ((row.quotedVolume / Math.max(totalQuotedVolume, 1)) * 100).toFixed(1),
        ),
        quotedVolume: row.quotedVolume,
      };
    })
    .sort((left, right) => {
      if (activeMetricKey === "conversionRate") {
        return right.conversionRate - left.conversionRate;
      }

      if (activeMetricKey === "totalSales") {
        return right.convertedVolume - left.convertedVolume;
      }

      return right.quotedVolume - left.quotedVolume;
    })
    .slice(0, 10);
  const rows: PromoPerformanceTableRow[] = sortedRows.map((row) => ({
    averageTimeToConvertLabel: formatDays(row.averageTimeToConvertDays),
    conversionRateLabel: formatPercent(row.conversionRate),
    convertedShareLabel: formatPercent(row.convertedShare),
    convertedVolumeLabel: formatCount(row.convertedVolume),
    id: row.id,
    label: row.label,
    quotedShareLabel: formatPercent(row.quotedShare),
    quotedVolumeLabel: formatCount(row.quotedVolume),
  }));

  return {
    firstColumnHeader,
    rows,
    title,
  };
};

const buildQuoteByPromoCodeCardData = (
  promoRows: ReturnType<typeof scalePromoCodeData>,
  agentRows: ReturnType<typeof scaleAgentData>,
): QuoteByPromoCodeCardData => ({
  agent: {
    conversionRate: buildPromoPerformanceViewData(
      agentRows.map((row) => ({
        averageTimeToConvertDays: row.averageTimeToConvertDays,
        convertedVolume: row.convertedVolume,
        id: row.agent,
        label: row.agent,
        quotedVolume: row.quotedVolume,
      })),
      "conversionRate",
      "Agent",
      "Quote by Agent (Top 10)",
    ),
    totalQuote: buildPromoPerformanceViewData(
      agentRows.map((row) => ({
        averageTimeToConvertDays: row.averageTimeToConvertDays,
        convertedVolume: row.convertedVolume,
        id: row.agent,
        label: row.agent,
        quotedVolume: row.quotedVolume,
      })),
      "totalQuote",
      "Agent",
      "Quote by Agent (Top 10)",
    ),
    totalSales: buildPromoPerformanceViewData(
      agentRows.map((row) => ({
        averageTimeToConvertDays: row.averageTimeToConvertDays,
        convertedVolume: row.convertedVolume,
        id: row.agent,
        label: row.agent,
        quotedVolume: row.quotedVolume,
      })),
      "totalSales",
      "Agent",
      "Quote by Agent (Top 10)",
    ),
  },
  promoCode: {
    conversionRate: buildPromoPerformanceViewData(
      promoRows.map((row) => ({
        averageTimeToConvertDays: row.averageTimeToConvertDays,
        convertedVolume: row.convertedVolume,
        id: row.promoCode,
        label: row.promoCode,
        quotedVolume: row.quotedVolume,
      })),
      "conversionRate",
      "Promo Code",
      "Quote by Promo Code (Top 10)",
    ),
    totalQuote: buildPromoPerformanceViewData(
      promoRows.map((row) => ({
        averageTimeToConvertDays: row.averageTimeToConvertDays,
        convertedVolume: row.convertedVolume,
        id: row.promoCode,
        label: row.promoCode,
        quotedVolume: row.quotedVolume,
      })),
      "totalQuote",
      "Promo Code",
      "Quote by Promo Code (Top 10)",
    ),
    totalSales: buildPromoPerformanceViewData(
      promoRows.map((row) => ({
        averageTimeToConvertDays: row.averageTimeToConvertDays,
        convertedVolume: row.convertedVolume,
        id: row.promoCode,
        label: row.promoCode,
        quotedVolume: row.quotedVolume,
      })),
      "totalSales",
      "Promo Code",
      "Quote by Promo Code (Top 10)",
    ),
  },
});

const buildMetricCells = (
  values: number[],
  formatter: (value: number) => string,
  trendDirection: "higher-is-better" | "lower-is-better" = "higher-is-better",
): QuoteMetricCellData[] =>
  values.map((value, index) => {
    const previousValue = values[index - 1];

    if (index === 0 || value === previousValue) {
      return {
        display: formatter(value),
        tone: "neutral",
        trend: "flat",
      };
    }

    const trend = value > previousValue ? "up" : "down";
    const tone =
      trendDirection === "lower-is-better"
        ? trend === "down"
          ? "positive"
          : "negative"
        : trend === "up"
          ? "positive"
          : "negative";

    return {
      display: formatter(value),
      tone,
      trend,
    };
  });

const buildQuoteMetricsTableData = (
  trendRows: QuoteTrendDatum[],
  showPreviousYearRows: boolean,
): QuoteMetricTableData => {
  const rows: QuoteMetricTableRowData[] = [
    {
      id: "total-quote",
      label: "Total Quote",
      values: buildMetricCells(
        trendRows.map((datum) => datum.totalQuote),
        formatCount,
      ),
    },
    ...(showPreviousYearRows
      ? [
          {
            id: "previous-year-total-quote",
            label: "Prev Yr Quote",
            values: buildMetricCells(
              trendRows.map((datum) => datum.previousYearTotalQuote),
              formatCount,
            ),
          },
        ]
      : []),
    {
      id: "total-sales",
      label: "Total Sales",
      values: buildMetricCells(
        trendRows.map((datum) => datum.totalSales),
        formatCount,
      ),
    },
    ...(showPreviousYearRows
      ? [
          {
            id: "previous-year-total-sales",
            label: "Prev Yr Sales",
            values: buildMetricCells(
              trendRows.map((datum) => datum.previousYearTotalSales),
              formatCount,
            ),
          },
        ]
      : []),
    {
      id: "conversion-rate",
      label: "Conversion %",
      values: buildMetricCells(
        trendRows.map((datum) => datum.conversionRate),
        formatPercent,
      ),
    },
    ...(showPreviousYearRows
      ? [
          {
            id: "previous-year-conversion-rate",
            label: "Prev Yr Conv %",
            values: buildMetricCells(
              trendRows.map((datum) => datum.previousYearConversionRate),
              formatPercent,
            ),
          },
        ]
      : []),
    {
      id: "avg-time-to-convert",
      label: "Avg. Time to Convert",
      values: buildMetricCells(
        trendRows.map((datum) => datum.averageTimeToConvertDays),
        formatDays,
        "lower-is-better",
      ),
    },
  ];

  return {
    months: trendRows.map((datum) => datum.month),
    rows,
  };
};

const monthIndexLookup: Record<string, number> = {
  Apr: 3,
  Aug: 7,
  Dec: 11,
  Feb: 1,
  Jan: 0,
  Jul: 6,
  Jun: 5,
  Mar: 2,
  May: 4,
  Nov: 10,
  Oct: 9,
  Sep: 8,
};

const formatSignedCount = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.abs(value).toLocaleString()}`;

const formatSignedPercentPoint = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.abs(Number(value.toFixed(1)))} pts`;

const resolveMonthDayCount = (label: string) => {
  const [monthToken, yearToken] = label.split(" ");
  const monthIndex = monthIndexLookup[monthToken] ?? 0;
  const year = 2000 + Number(yearToken ?? "0");

  return new Date(year, monthIndex + 1, 0).getDate();
};

const allocateDailyTotals = (
  total: number,
  dayCount: number,
  options: {
    endBias: number;
    phase: number;
  },
) => {
  if (dayCount <= 0) {
    return [];
  }

  if (total <= 0) {
    return Array.from({ length: dayCount }, () => 0);
  }

  const weights = Array.from({ length: dayCount }, (_, index) => {
    const progress = (index + 1) / dayCount;
    return Math.max(
      0.24,
      0.92 +
        Math.sin(progress * Math.PI * 1.45 + options.phase) * 0.18 +
        progress * options.endBias,
    );
  });
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const rawAllocations = weights.map((weight) => (total * weight) / totalWeight);
  const baseAllocations = rawAllocations.map((value) => Math.floor(value));
  let remainder = total - baseAllocations.reduce((sum, value) => sum + value, 0);

  if (remainder > 0) {
    const rankedRemainders = rawAllocations
      .map((value, index) => ({
        fraction: value - Math.floor(value),
        index,
      }))
      .sort((left, right) => right.fraction - left.fraction);

    for (let pointer = 0; pointer < rankedRemainders.length && remainder > 0; pointer += 1) {
      baseAllocations[rankedRemainders[pointer].index] += 1;
      remainder -= 1;
    }
  }

  return baseAllocations;
};

const buildCumulativeTrendData = (
  metricKey: TrendSeriesKey,
  trendRows: QuoteTrendDatum[],
): CumulativeTrendDatum[] => {
  const latestMonth = trendRows[trendRows.length - 1];

  if (!latestMonth) {
    return [];
  }

  const dayCount = resolveMonthDayCount(latestMonth.month);
  const currentQuoteDaily = allocateDailyTotals(latestMonth.totalQuote, dayCount, {
    endBias: 0.1,
    phase: 0.32,
  });
  const previousQuoteDaily = allocateDailyTotals(
    latestMonth.previousYearTotalQuote,
    dayCount,
    {
      endBias: 0.05,
      phase: -0.18,
    },
  );
  const currentSalesDaily = allocateDailyTotals(latestMonth.totalSales, dayCount, {
    endBias: 0.18,
    phase: 0.64,
  });
  const previousSalesDaily = allocateDailyTotals(
    latestMonth.previousYearTotalSales,
    dayCount,
    {
      endBias: 0.12,
      phase: 0.08,
    },
  );
  let runningCurrent = 0;
  let runningPrevious = 0;
  let runningCurrentSales = 0;
  let runningPreviousSales = 0;
  let runningCurrentQuote = 0;
  let runningPreviousQuote = 0;

  return Array.from({ length: dayCount }, (_, index) => {
    runningCurrentQuote += currentQuoteDaily[index] ?? 0;
    runningPreviousQuote += previousQuoteDaily[index] ?? 0;
    runningCurrentSales += currentSalesDaily[index] ?? 0;
    runningPreviousSales += previousSalesDaily[index] ?? 0;

    if (metricKey === "conversionRate") {
      return {
        currentCumulative: Number(
          ((runningCurrentSales / Math.max(runningCurrentQuote, 1)) * 100).toFixed(1),
        ),
        month: String(index + 1),
        previousYearCumulative: Number(
          (
            (runningPreviousSales / Math.max(runningPreviousQuote, 1)) *
            100
          ).toFixed(1),
        ),
      };
    }

    if (metricKey === "totalSales") {
      runningCurrent = runningCurrentSales;
      runningPrevious = runningPreviousSales;
    } else {
      runningCurrent = runningCurrentQuote;
      runningPrevious = runningPreviousQuote;
    }

    return {
      currentCumulative: runningCurrent,
      month: String(index + 1),
      previousYearCumulative: runningPrevious,
    };
  });
};

const buildCumulativeMetricsTableData = (
  metricKey: TrendSeriesKey,
  trendRows: QuoteTrendDatum[],
): QuoteMetricTableData => {
  const cumulativeRows = buildCumulativeTrendData(metricKey, trendRows);
  const formatMetricValue =
    metricKey === "conversionRate" ? formatPercent : formatCount;
  const formatGapValue =
    metricKey === "conversionRate" ? formatSignedPercentPoint : formatSignedCount;
  const gapDirection =
    metricKey === "conversionRate" ? "higher-is-better" : "higher-is-better";

  return {
    months: cumulativeRows.map((row) => row.month),
    rows: [
      {
        id: "current-cumulative",
        label: metricKey === "conversionRate" ? "Current Cum %" : "Current Cum",
        values: buildMetricCells(
          cumulativeRows.map((row) => row.currentCumulative),
          formatMetricValue,
        ),
      },
      {
        id: "previous-cumulative",
        label: metricKey === "conversionRate" ? "Prev Yr Cum %" : "Prev Yr Cum",
        values: buildMetricCells(
          cumulativeRows.map((row) => row.previousYearCumulative),
          formatMetricValue,
        ),
      },
      {
        id: "cumulative-gap",
        label: metricKey === "conversionRate" ? "Point Gap" : "Gap",
        values: buildMetricCells(
          cumulativeRows.map(
            (row) => row.currentCumulative - row.previousYearCumulative,
          ),
          formatGapValue,
          gapDirection,
        ),
      },
    ],
  };
};

const buildTrendSignal = (
  seriesKey: TrendSeriesKey,
  trendRows: QuoteTrendDatum[],
): {
  changeDirection: "down" | "flat" | "up";
  currentMonth: QuoteTrendDatum;
  percentChange: number;
  signal: QuotePerformanceSignalData;
} => {
  const activeTrendSeries =
    trendSeriesOptions.find((series) => series.key === seriesKey) ??
    trendSeriesOptions[0];
  const currentMonth = trendRows[trendRows.length - 1];
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

  return {
    changeDirection,
    currentMonth,
    percentChange,
    signal: {
      ariaLabel: `${changeDescription} by ${formatDeltaPercent(percentChange)} year over year for ${activeTrendSeries.label}.`,
      direction: changeDirection,
      kind: "trend",
      label: "YoY",
      tone:
        changeDirection === "up"
          ? "positive"
          : changeDirection === "down"
            ? "negative"
            : "neutral",
      value: formatDeltaPercent(percentChange),
    },
  };
};

const buildQuotePerformanceMetricViewData = (
  metricKey: TrendSeriesKey,
  trendRows: QuoteTrendDatum[],
  brandRows: BrandContributionDatum[],
  petRows: PetTypeMixDatum[],
): QuotePerformanceMetricViewData => {
  const activeTrendSeries =
    trendSeriesOptions.find((series) => series.key === metricKey) ??
    trendSeriesOptions[0];
  const conversionTrendSeries =
    trendSeriesOptions.find((series) => series.key === "conversionRate") ??
    trendSeriesOptions[0];
  const metricDescriptor = getMetricViewDescriptor(metricKey);
  const brandTabConfig =
    quoteCardTabs.find((tab) => tab.key === "brand-contribution") ??
    quoteCardTabs[0];
  const petTabConfig =
    quoteCardTabs.find((tab) => tab.key === "pet-type-mix") ?? quoteCardTabs[0];
  const conversionTrendConfig =
    quoteCardTabs.find((tab) => tab.key === "conversion-trend") ??
    quoteCardTabs[0];
  const quoteTrendLabel =
    activeTrendSeries.key === "conversionRate"
      ? "Conversion Performance"
      : metricDescriptor.trendTabLabel;
  const quoteTrendSubtitle =
    activeTrendSeries.key === "conversionRate"
      ? "Monthly conversion performance versus prior year."
      : activeTrendSeries.key === "totalSales"
        ? "Monthly sales volume and performance versus prior year."
        : "Monthly quoted volume and performance versus prior year.";
  const quoteTrendSignal = buildTrendSignal(activeTrendSeries.key, trendRows);
  const conversionTrendSignal = buildTrendSignal("conversionRate", trendRows);
  const quoteTrendAnalysis = buildAnalysisContent({
    activeTab: "quote-trend",
    activeTrendSeries,
    brandContributionData: brandRows,
    changeDirection: quoteTrendSignal.changeDirection,
    currentMonth: quoteTrendSignal.currentMonth,
    petTypeMixData: petRows,
    percentChange: quoteTrendSignal.percentChange,
  });
  const conversionTrendAnalysis = buildAnalysisContent({
    activeTab: "conversion-trend",
    activeTrendSeries: conversionTrendSeries,
    brandContributionData: brandRows,
    changeDirection: conversionTrendSignal.changeDirection,
    currentMonth: conversionTrendSignal.currentMonth,
    petTypeMixData: petRows,
    percentChange: conversionTrendSignal.percentChange,
  });
  const leadBrandContribution = [...brandRows].sort(
    (left, right) => right.quoteCount - left.quoteCount,
  )[0];
  const leadPetTypeMix = [...petRows].sort(
    (left, right) => right.quoteCount - left.quoteCount,
  )[0];
  const brandAnalysis = buildAnalysisContent({
    activeTab: "brand-contribution",
    activeTrendSeries,
    brandContributionData: brandRows,
    changeDirection: quoteTrendSignal.changeDirection,
    currentMonth: quoteTrendSignal.currentMonth,
    petTypeMixData: petRows,
    percentChange: quoteTrendSignal.percentChange,
  });
  const petAnalysis = buildAnalysisContent({
    activeTab: "pet-type-mix",
    activeTrendSeries,
    brandContributionData: brandRows,
    changeDirection: quoteTrendSignal.changeDirection,
    currentMonth: quoteTrendSignal.currentMonth,
    petTypeMixData: petRows,
    percentChange: quoteTrendSignal.percentChange,
  });

  return {
    tabs: [
      {
        accentRgb: activeTrendSeries.accentRgb,
        analysis: quoteTrendAnalysis,
        key: "quote-trend",
        kind: "quote-trend",
        label: quoteTrendLabel,
        metricsTable: buildQuoteMetricsTableData(trendRows, true),
        panelTitle:
          activeTrendSeries.key === "conversionRate"
            ? "Conversion Rate Trend"
            : `${activeTrendSeries.label.replace("Total ", "")} Trend`,
        signal: quoteTrendSignal.signal,
        subtitle: quoteTrendSubtitle,
        title: metricDescriptor.trendTabLabel,
        trendData: trendRows,
        trendSeriesKey: activeTrendSeries.key,
      },
      {
        accentRgb: conversionTrendSeries.accentRgb,
        analysis: conversionTrendAnalysis,
        key: "conversion-trend",
        kind: "conversion-trend",
        label: conversionTrendConfig.label,
        metricsTable: buildQuoteMetricsTableData(trendRows, false),
        panelTitle: "Conversion Rate Trend",
        signal: conversionTrendSignal.signal,
        subtitle: conversionTrendConfig.subtitle,
        title: conversionTrendConfig.title,
        trendData: trendRows,
      },
      {
        accentRgb: "212, 117, 88",
        analysis: brandAnalysis,
        brandData: brandRows,
        key: "brand-contribution",
        kind: "brand-contribution",
        label: brandTabConfig.label,
        panelTitle: brandTabConfig.title,
        signal: {
          ariaLabel: `${leadBrandContribution?.brand ?? "No brand"} leads brand contribution at ${formatPercent(leadBrandContribution?.share ?? 0)}.`,
          direction: "flat",
          kind: "dot",
          label: leadBrandContribution?.brand ?? "No brand",
          tone: "warm",
          value: formatPercent(leadBrandContribution?.share ?? 0),
        },
        subtitle: brandTabConfig.subtitle,
        title: brandTabConfig.title,
      },
      {
        accentRgb: "78, 141, 245",
        analysis: petAnalysis,
        key: "pet-type-mix",
        kind: "pet-type-mix",
        label: petTabConfig.label,
        panelTitle: petTabConfig.title,
        petTypeData: petRows,
        signal: {
          ariaLabel: `${leadPetTypeMix?.petType ?? "No segment"} account for ${formatPercent(leadPetTypeMix?.share ?? 0)} of quotes.`,
          direction: "flat",
          kind: "dot",
          label: leadPetTypeMix?.petType ?? "No segment",
          tone: "cool",
          value: formatPercent(leadPetTypeMix?.share ?? 0),
        },
        subtitle: petTabConfig.subtitle,
        title: petTabConfig.title,
        totalQuote: petRows.reduce((sum, row) => sum + row.quoteCount, 0),
      },
    ],
  };
};

const buildQuotePerformanceCardData = (
  trendRows: QuoteTrendDatum[],
  brandRows: BrandContributionDatum[],
  petRows: PetTypeMixDatum[],
): QuotePerformanceCardData => ({
  conversionRate: buildQuotePerformanceMetricViewData(
    "conversionRate",
    trendRows,
    brandRows,
    petRows,
  ),
  totalQuote: buildQuotePerformanceMetricViewData(
    "totalQuote",
    trendRows,
    brandRows,
    petRows,
  ),
  totalSales: buildQuotePerformanceMetricViewData(
    "totalSales",
    trendRows,
    brandRows,
    petRows,
  ),
});

const buildPolicyCumulativeTabData = (
  metricKey: TrendSeriesKey,
  trendRows: QuoteTrendDatum[],
): QuotePerformanceTabData => {
  const metricDescriptor = getMetricViewDescriptor(metricKey, "policy");
  const activeTrendSeries =
    getTrendSeriesOptions("policy").find((series) => series.key === metricKey) ??
    getTrendSeriesOptions("policy")[0];
  const cumulativeTrendRows = buildCumulativeTrendData(metricKey, trendRows);
  const metricsTable = buildCumulativeMetricsTableData(metricKey, trendRows);
  const latestTrendMonth = trendRows[trendRows.length - 1];
  const latestPoint = cumulativeTrendRows[cumulativeTrendRows.length - 1] ?? {
    currentCumulative: 0,
    month: "",
    previousYearCumulative: 0,
  };
  const cumulativeGap =
    latestPoint.currentCumulative - latestPoint.previousYearCumulative;
  const percentChange =
    latestPoint.previousYearCumulative === 0
      ? 0
      : ((latestPoint.currentCumulative - latestPoint.previousYearCumulative) /
          latestPoint.previousYearCumulative) *
        100;
  const changeDirection =
    cumulativeGap > 0 ? "up" : cumulativeGap < 0 ? "down" : "flat";
  const isConversionMetric = metricKey === "conversionRate";
  const signalValue = isConversionMetric
    ? formatPointGap(cumulativeGap)
    : formatDeltaPercent(percentChange);
  const signalTone =
    changeDirection === "up"
      ? "positive"
      : changeDirection === "down"
        ? "negative"
        : "neutral";
  const subjectLabel =
    metricKey === "conversionRate"
      ? "cumulative conversion"
      : metricKey === "totalSales"
        ? "cumulative sales"
        : "cumulative policies";
  const displayFormatter =
    metricKey === "conversionRate" ? formatPercent : formatCount;
  const pointFormatter =
    metricKey === "conversionRate" ? formatPointGap : formatSignedCount;
  const analysis: QuotePerformanceAnalysisData = {
    activeAnalysisAlerts: [
      {
        id: `cumulative-yoy-${metricKey}`,
        severity: changeDirection === "down" ? "high" : "low",
        text: `${metricDescriptor.buttonLabel} cumulative sits at ${displayFormatter(
          latestPoint.currentCumulative,
        )} versus ${displayFormatter(
          latestPoint.previousYearCumulative,
        )} at the same point last year.`,
        tone: "trend",
      },
      {
        id: `cumulative-gap-${metricKey}`,
        severity: "medium",
        text: isConversionMetric
          ? `Cumulative conversion gap is ${formatPointGap(
              cumulativeGap,
            )} against prior year, which frames how far ahead or behind the current book is.`
          : `The current cumulative run-rate is ${pointFormatter(
              latestPoint.currentCumulative - latestPoint.previousYearCumulative,
            )} against last year at the same month cut.`,
        tone: "exception",
      },
      {
        id: `cumulative-watch-${metricKey}`,
        severity: "medium",
        text: isConversionMetric
          ? `Day ${latestPoint.month} cumulative conversion for ${latestTrendMonth?.month ?? "the current month"} should stay on watch because small daily moves can still shift the month close rate.`
          : `Day ${latestPoint.month} cumulative trajectory for ${latestTrendMonth?.month ?? "the current month"} should stay on watch because the gap to last year can still shift before month-end.`,
        tone: "risk",
      },
    ],
    activeAnalysisSummary: [
      `${displayFormatter(latestPoint.currentCumulative)} current`,
      `${displayFormatter(latestPoint.previousYearCumulative)} last year`,
      `Day ${latestPoint.month}`,
      isConversionMetric
        ? formatPointGap(cumulativeGap)
        : `YoY ${formatDeltaPercent(percentChange)}`,
    ],
    analysisSpotlightLabel: isConversionMetric ? "Point Gap" : "YoY Signal",
    analysisSpotlightMeta: `${subjectLabel} through day ${latestPoint.month} of ${latestTrendMonth?.month ?? "current month"} versus ${latestTrendMonth?.previousYearMonth ?? "last year"}`,
    analysisSpotlightTone: signalTone,
    analysisSpotlightValue: signalValue,
    insightAccentRgb: activeTrendSeries.accentRgb,
  };

  return {
    accentRgb: activeTrendSeries.accentRgb,
    analysis,
    key: "cumulative-trend",
    kind: "cumulative-trend",
    label: "Cumulative",
    metricsTable,
    panelTitle: `Cumulative ${metricDescriptor.buttonLabel} Trend`,
    signal: {
      ariaLabel: isConversionMetric
        ? `Cumulative conversion is ${displayFormatter(
            latestPoint.currentCumulative,
          )} versus ${displayFormatter(
            latestPoint.previousYearCumulative,
          )} at the same point last year, a ${formatPointGap(
            cumulativeGap,
          )} gap.`
        : `${subjectLabel} is ${displayFormatter(
            latestPoint.currentCumulative,
          )} versus ${displayFormatter(
            latestPoint.previousYearCumulative,
          )} at the same point last year, a ${formatDeltaPercent(
            percentChange,
          )} year over year change.`,
      direction: changeDirection,
      kind: "trend",
      label: isConversionMetric ? "Gap" : "YTD",
      tone: signalTone,
      value: signalValue,
    },
    subtitle: isConversionMetric
      ? `Daily cumulative conversion for ${latestTrendMonth?.month ?? "the current month"} against ${latestTrendMonth?.previousYearMonth ?? "last year"}.`
      : `Daily cumulative ${metricDescriptor.buttonLabel.toLowerCase()} for ${latestTrendMonth?.month ?? "the current month"} against ${latestTrendMonth?.previousYearMonth ?? "last year"}.`,
    title: "Cumulative Trend",
    trendData: cumulativeTrendRows,
    yAxisWidth: isConversionMetric ? 56 : 64,
  };
};

const addPolicyCumulativeTabs = (
  policyPerformanceData: QuotePerformanceCardData,
  trendRows: QuoteTrendDatum[],
): QuotePerformanceCardData => {
  const addTab = (
    metricView: QuotePerformanceMetricViewData,
    metricKey: TrendSeriesKey,
  ): QuotePerformanceMetricViewData => {
    const cumulativeTab = buildPolicyCumulativeTabData(metricKey, trendRows);
    const trendIndex = metricView.tabs.findIndex((tab) => tab.key === "quote-trend");

    if (trendIndex === -1) {
      return {
        tabs: [cumulativeTab, ...metricView.tabs],
      };
    }

    return {
      tabs: [
        ...metricView.tabs.slice(0, trendIndex + 1),
        cumulativeTab,
        ...metricView.tabs.slice(trendIndex + 1),
      ],
    };
  };

  return {
    conversionRate: addTab(policyPerformanceData.conversionRate, "conversionRate"),
    totalQuote: addTab(policyPerformanceData.totalQuote, "totalQuote"),
    totalSales: addTab(policyPerformanceData.totalSales, "totalSales"),
  };
};

export const buildQuoteDashboardData = ({
  brands,
  countries,
  petTypes,
}: QuoteDashboardFilters): QuoteDashboardDataBundle => {
  const countryFactor = resolveSelectedFactor(
    countries,
    countryWeightMap,
    baseQuoteByCountryData.reduce((sum, row) => sum + row.totalQuote, 0),
  );
  const brandFactor = resolveSelectedFactor(
    brands,
    brandWeightMap,
    brandContributionTotalQuotes,
  );
  const petFactor = resolveSelectedFactor(
    petTypes,
    petWeightMap,
    petTypeMixTotalQuotes,
  );

  const globalScale = averageActiveFactors([countryFactor, brandFactor, petFactor]);
  const countrySupportScale = averageActiveFactors([brandFactor, petFactor]);
  const brandSupportScale = averageActiveFactors([countryFactor, petFactor]);
  const petSupportScale = averageActiveFactors([countryFactor, brandFactor]);

  const filteredCountryRows = countries.length
    ? baseQuoteByCountryData.filter((row) => countries.includes(row.country))
    : baseQuoteByCountryData;
  const filteredLapsedRows = countries.length
    ? baseLapsedQuoteByCountryData.filter((row) => countries.includes(row.country))
    : baseLapsedQuoteByCountryData;
  const filteredPendingRows = countries.length
    ? basePendingQuoteByCountryData.filter((row) => countries.includes(row.country))
    : basePendingQuoteByCountryData;
  const filteredBrandRows = brands.length
    ? baseBrandContributionData.filter((row) => brands.includes(row.brand))
    : baseBrandContributionData;
  const filteredPetRows = petTypes.length
    ? basePetTypeMixData.filter((row) => petTypes.includes(row.petType))
    : basePetTypeMixData;
  const rebuiltCountryRows = rebuildCountryData(
    filteredCountryRows,
    countrySupportScale,
  );
  const rebuiltBrandRows = rebuildBrandData(filteredBrandRows, brandSupportScale);
  const rebuiltPendingRows = filteredPendingRows.map((row) => ({
    ...row,
    pendingQuotes: scaleCount(row.pendingQuotes, countrySupportScale),
  }));
  const rebuiltLapsedRows = filteredLapsedRows.map((row) => ({
    ...row,
    bucket0To30: scaleCount(row.bucket0To30, countrySupportScale),
    bucket31To60: scaleCount(row.bucket31To60, countrySupportScale),
    bucket61To90: scaleCount(row.bucket61To90, countrySupportScale),
  }));
  const rebuiltPetRows = rebuildPetTypeData(filteredPetRows, petSupportScale);
  const rebuiltPremiumChannelRows = rebuildPremiumChannelData(
    basePremiumChannelSplitData,
    globalScale,
  );
  const rebuiltTrendRows = scaleTrendData(baseTrendData, globalScale);
  const rebuiltProductRows = scaleProductData(
    baseProductPerformanceData,
    globalScale,
  );
  const rebuiltPromoRows = scalePromoCodeData(
    basePromoCodePerformanceData,
    globalScale,
  );
  const rebuiltAgentRows = scaleAgentData(baseAgentPerformanceData, globalScale);

  return {
    premiumOverviewData: buildPremiumOverviewCardData(
      rebuiltPremiumChannelRows,
      rebuiltPendingRows,
      rebuiltTrendRows,
    ),
    productPerformanceData: buildProductPerformanceCardData(rebuiltProductRows),
    promoCodePerformanceData: buildQuoteByPromoCodeCardData(
      rebuiltPromoRows,
      rebuiltAgentRows,
    ),
    quoteByCountryData: buildQuoteByCountryCardData(rebuiltCountryRows),
    quotePerformanceData: buildQuotePerformanceCardData(
      rebuiltTrendRows,
      rebuiltBrandRows,
      rebuiltPetRows,
    ),
    quoteWorkflowData: buildQuoteWorkflowCardData(
      rebuiltLapsedRows,
      rebuiltPendingRows,
    ),
  };
};

const replaceQuoteCopy = (value: string) =>
  value
    .replace(/\bQuoted\b/g, "Policy")
    .replace(/\bquoted\b/g, "policy")
    .replace(/\bQuotes\b/g, "Policies")
    .replace(/\bquotes\b/g, "policies")
    .replace(/\bQuote\b/g, "Policy")
    .replace(/\bquote\b/g, "policy");

const NON_REPLACED_STRING_KEYS = new Set(["idBase", "key", "kind"]);

const mapDashboardStrings = <T,>(value: T, parentKey?: string): T => {
  if (typeof value === "string") {
    return (NON_REPLACED_STRING_KEYS.has(parentKey ?? "")
      ? value
      : replaceQuoteCopy(value)) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => mapDashboardStrings(entry, parentKey)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        mapDashboardStrings(entry, key),
      ]),
    ) as T;
  }

  return value;
};

const buildWorkflowBarInsights = (
  chartData: WorkflowBarChartDatum[],
  metricLabel: string,
  contextLabel: string,
): DashboardInsightDatum[] => {
  const totalValue = chartData.reduce((sum, row) => sum + row.value, 0);
  const rankedRows = [...chartData].sort((left, right) => right.value - left.value);
  const leadRow = rankedRows[0];
  const lightestRow = rankedRows[rankedRows.length - 1];
  const topTwoTotal = rankedRows.slice(0, 2).reduce((sum, row) => sum + row.value, 0);
  const metricLabelLower = metricLabel.toLowerCase();
  const contextLabelLower = contextLabel.toLowerCase();

  return [
    {
      id: `${contextLabelLower.replace(/\s+/g, "-")}-lead`,
      label: "Lead Market",
      note: leadRow
        ? `${leadRow.countryCode} holds ${formatPercent(
            Number(((leadRow.value / Math.max(totalValue, 1)) * 100).toFixed(1)),
          )} of ${contextLabelLower}.`
        : `No ${contextLabelLower} data is available.`,
      tone: "neutral",
      value: leadRow
        ? `${leadRow.countryCode} ${formatCount(leadRow.value)}`
        : "No data",
    },
    {
      id: `${contextLabelLower.replace(/\s+/g, "-")}-top-two`,
      label: "Top 2 Mix",
      note: `${rankedRows[0]?.countryCode ?? ""} and ${rankedRows[1]?.countryCode ?? ""} account for most ${contextLabelLower}.`,
      tone: "positive",
      value: formatPercent(
        Number(((topTwoTotal / Math.max(totalValue, 1)) * 100).toFixed(1)),
      ),
    },
    {
      id: `${contextLabelLower.replace(/\s+/g, "-")}-lightest`,
      label: "Lowest Load",
      note: lightestRow
        ? `${lightestRow.country} carries the lightest ${metricLabelLower} footprint.`
        : `No ${contextLabelLower} data is available.`,
      tone: "negative",
      value: lightestRow
        ? `${lightestRow.countryCode} ${formatCount(lightestRow.value)}`
        : "No data",
    },
  ];
};

interface WorkflowReasonTemplate {
  id: string;
  reason: string;
  share: number;
  yoyChange: number;
}

interface WorkflowReasonTableResult {
  rows: WorkflowReasonTableRow[];
  topShare: number;
}

const getWorkflowReasonTrend = (
  value: number,
): WorkflowReasonTableRow["yoyTrend"] =>
  value > 0 ? "up" : value < 0 ? "down" : "flat";

const buildWorkflowReasonTableData = (
  total: number,
  templates: WorkflowReasonTemplate[],
  limit = 10,
): WorkflowReasonTableResult => {
  if (total <= 0) {
    return {
      rows: templates.slice(0, limit).map((template) => ({
        count: 0,
        id: template.id,
        reason: template.reason,
        share: 0,
        yoyChange: template.yoyChange,
        yoyTrend: getWorkflowReasonTrend(template.yoyChange),
      })),
      topShare: 0,
    };
  }

  const seededRows = templates.map((template, index) => {
    const rawCount = (total * template.share) / 100;
    const count = Math.floor(rawCount);

    return {
      ...template,
      count,
      fraction: rawCount - count,
      index,
    };
  });

  let remainingCount =
    total - seededRows.reduce((sum, row) => sum + row.count, 0);

  const rankedByFraction = [...seededRows].sort((left, right) => {
    if (right.fraction === left.fraction) {
      return left.index - right.index;
    }

    return right.fraction - left.fraction;
  });

  for (let index = 0; index < rankedByFraction.length && remainingCount > 0; index += 1) {
    rankedByFraction[index].count += 1;
    remainingCount -= 1;
  }

  const countsById = new Map(
    rankedByFraction.map((row) => [row.id, row.count]),
  );

  const rows = templates
    .map((template, index) => {
      const count = countsById.get(template.id) ?? 0;

      return {
        count,
        id: template.id,
        index,
        reason: template.reason,
        share: Number(((count / total) * 100).toFixed(1)),
        yoyChange: template.yoyChange,
        yoyTrend: getWorkflowReasonTrend(template.yoyChange),
      };
    })
    .sort((left, right) => {
      if (right.count === left.count) {
        return left.index - right.index;
      }

      return right.count - left.count;
    })
    .slice(0, limit)
    .map(({ index: _index, ...row }) => row);

  const topShare = Number(
    rows.reduce((sum, row) => sum + row.share, 0).toFixed(1),
  );

  return {
    rows,
    topShare,
  };
};

const buildWorkflowBarView = ({
  accentRgb,
  contextLabel,
  fill,
  key,
  label,
  metricLabel,
  reasonTableShare,
  reasonTableRows,
  rows,
  subtitle,
  title,
}: {
  accentRgb: string;
  contextLabel: string;
  fill: string;
  key: QuoteWorkflowTabKey;
  label: string;
  metricLabel: string;
  reasonTableShare?: number;
  reasonTableRows?: WorkflowReasonTableRow[];
  rows: Array<{ country: string; value: number }>;
  subtitle: string;
  title: string;
}) => {
  const chartData: WorkflowBarChartDatum[] = rows.map((row) => ({
    country: row.country,
    countryCode: getCountryCode(row.country),
    fill,
    value: row.value,
    valueLabel: formatCount(row.value),
  }));

  return {
    accentRgb,
    chartData,
    insights: buildWorkflowBarInsights(chartData, metricLabel, contextLabel),
    key,
    kind: "bar" as const,
    label,
    metricLabel,
    reasonTableShare,
    reasonTableRows,
    subtitle,
    title,
  };
};

const buildPolicyWorkflowCardData = (
  countryRows: QuoteByCountryViewRow[],
  lapsedRows: QuoteAgingByCountryDatum[],
  pendingChartData: WorkflowBarChartDatum[],
): QuoteWorkflowCardData => {
  const lapsedTotals = new Map(
    lapsedRows.map((row) => [
      row.country,
      row.bucket0To30 + row.bucket31To60 + row.bucket61To90,
    ]),
  );
  const pendingTotals = new Map(
    pendingChartData.map((row) => [row.country, row.value]),
  );

  const activeRows = countryRows.map((row) => ({
    country: row.country,
    value: scaleCount(row.totalQuote, 4.1) + scaleCount(row.totalSales, 2.3),
  }));
  const pendingRows = countryRows.map((row) => ({
    country: row.country,
    value:
      (pendingTotals.get(row.country) ?? 0) + Math.max(3, Math.round(row.totalSales * 1.1)),
  }));
  const cancelledRows = countryRows.map((row) => ({
    country: row.country,
    value:
      Math.max(4, Math.round((lapsedTotals.get(row.country) ?? 0) * 0.74)) +
      Math.max(2, Math.round(row.totalSales * 0.35)),
  }));
  const referRows = countryRows.map((row) => ({
    country: row.country,
    value:
      Math.max(2, Math.round((pendingTotals.get(row.country) ?? 0) * 0.42)) +
      Math.max(1, Math.round(row.totalSales * 0.18)),
  }));
  const expiredRows = countryRows.map((row) => ({
    country: row.country,
    value: Math.max(3, Math.round((lapsedTotals.get(row.country) ?? 0) * 0.88)),
  }));
  const pendingReasonTable = buildWorkflowReasonTableData(
    pendingRows.reduce((sum, row) => sum + row.value, 0),
    [
      {
        id: "pending-awaiting-docs",
        reason: "Awaiting Documents",
        share: 17,
        yoyChange: 8.4,
      },
      {
        id: "pending-payment-check",
        reason: "Payment Validation",
        share: 14,
        yoyChange: -2.8,
      },
      {
        id: "pending-referral-review",
        reason: "Referral Review",
        share: 12,
        yoyChange: 5.1,
      },
      {
        id: "pending-customer-contact",
        reason: "Customer Callback",
        share: 10,
        yoyChange: 1.7,
      },
      {
        id: "pending-risk-check",
        reason: "Risk Checks",
        share: 9,
        yoyChange: -4.3,
      },
      {
        id: "pending-address-check",
        reason: "Address Verification",
        share: 8,
        yoyChange: 3.6,
      },
      {
        id: "pending-underwriter-review",
        reason: "Underwriter Review",
        share: 7,
        yoyChange: 6.8,
      },
      {
        id: "pending-policy-amendment",
        reason: "Policy Amendment",
        share: 6,
        yoyChange: -1.5,
      },
      {
        id: "pending-banking-confirmation",
        reason: "Banking Confirmation",
        share: 5,
        yoyChange: 2.4,
      },
      {
        id: "pending-manual-qc",
        reason: "Manual QA",
        share: 4,
        yoyChange: -0.9,
      },
      {
        id: "pending-customer-query",
        reason: "Customer Query",
        share: 4,
        yoyChange: 4.2,
      },
      {
        id: "pending-compliance-hold",
        reason: "Compliance Hold",
        share: 4,
        yoyChange: -3.1,
      },
    ],
  );
  const cancelledReasonTable = buildWorkflowReasonTableData(
    cancelledRows.reduce((sum, row) => sum + row.value, 0),
    [
      {
        id: "cancelled-non-payment",
        reason: "Non-payment",
        share: 18,
        yoyChange: 11.2,
      },
      {
        id: "cancelled-customer-request",
        reason: "Customer Request",
        share: 14,
        yoyChange: -3.6,
      },
      {
        id: "cancelled-underwriting",
        reason: "Underwriting Decline",
        share: 12,
        yoyChange: 4.8,
      },
      {
        id: "cancelled-duplicate",
        reason: "Duplicate Cover",
        share: 10,
        yoyChange: -1.9,
      },
      {
        id: "cancelled-pricing",
        reason: "Pricing Objection",
        share: 9,
        yoyChange: 6.1,
      },
      {
        id: "cancelled-renewal-overlap",
        reason: "Renewal Overlap",
        share: 8,
        yoyChange: 2.7,
      },
      {
        id: "cancelled-risk-change",
        reason: "Risk Profile Change",
        share: 7,
        yoyChange: 5.3,
      },
      {
        id: "cancelled-admin-error",
        reason: "Admin Error",
        share: 6,
        yoyChange: -2.2,
      },
      {
        id: "cancelled-claim-history",
        reason: "Claims History",
        share: 5,
        yoyChange: 3.9,
      },
      {
        id: "cancelled-fraud-check",
        reason: "Fraud Review",
        share: 4,
        yoyChange: 1.1,
      },
      {
        id: "cancelled-data-mismatch",
        reason: "Data Mismatch",
        share: 4,
        yoyChange: -1.4,
      },
      {
        id: "cancelled-other",
        reason: "Other",
        share: 3,
        yoyChange: 0.6,
      },
    ],
  );

  return {
    idBase: "policy-workflow",
    title: "Policy Workflow",
    tabs: [
      buildWorkflowBarView({
        accentRgb: "90, 196, 171",
        contextLabel: "active policies",
        fill: "#5ac4ab",
        key: "active-policies",
        label: "Active",
        metricLabel: "Active Policies",
        rows: activeRows,
        subtitle: "Current active book by country.",
        title: "Active Policies",
      }),
      buildWorkflowBarView({
        accentRgb: "123, 132, 247",
        contextLabel: "pending policies",
        fill: "#7b84f7",
        key: "pending-policies",
        label: "Pending",
        metricLabel: "Pending Policies",
        reasonTableRows: pendingReasonTable.rows,
        reasonTableShare: pendingReasonTable.topShare,
        rows: pendingRows,
        subtitle: "Current pending policy queue by country.",
        title: "Pending Policies",
      }),
      buildWorkflowBarView({
        accentRgb: "192, 90, 82",
        contextLabel: "cancelled policies",
        fill: "#c05a52",
        key: "cancelled-policies",
        label: "Cancelled",
        metricLabel: "Cancelled Policies",
        reasonTableRows: cancelledReasonTable.rows,
        reasonTableShare: cancelledReasonTable.topShare,
        rows: cancelledRows,
        subtitle: "Cancelled policies by country within the selected scope.",
        title: "Cancelled Policies",
      }),
      buildWorkflowBarView({
        accentRgb: "213, 150, 88",
        contextLabel: "refer policies",
        fill: "#d59658",
        key: "refer-policies",
        label: "Refer",
        metricLabel: "Refer Policies",
        rows: referRows,
        subtitle: "Policies that still require referral handling by country.",
        title: "Refer Policies",
      }),
      buildWorkflowBarView({
        accentRgb: "131, 145, 177",
        contextLabel: "expired policies",
        fill: "#8391b1",
        key: "expired-policies",
        label: "Expired",
        metricLabel: "Expired Policies",
        rows: expiredRows,
        subtitle: "Expired policies by country across the current book.",
        title: "Expired Policies",
      }),
    ],
  };
};

export const buildPolicyDashboardData = (
  filters: QuoteDashboardFilters,
): QuoteDashboardDataBundle => {
  const quoteBundle = buildQuoteDashboardData(filters);
  const policyBundle = mapDashboardStrings(quoteBundle);
  const quoteTrendTab = quoteBundle.quotePerformanceData.totalQuote.tabs.find(
    (tab) => tab.kind === "quote-trend",
  );
  const countryRows = quoteBundle.quoteByCountryData.totalQuote.tableRows;
  const lapsedTab = quoteBundle.quoteWorkflowData.tabs.find(
    (tab) => tab.kind === "lapsed",
  );
  const pendingTab = quoteBundle.quoteWorkflowData.tabs.find(
    (tab) => tab.kind === "bar",
  );

  return {
    ...policyBundle,
    quotePerformanceData: addPolicyCumulativeTabs(
      policyBundle.quotePerformanceData,
      quoteTrendTab?.trendData ?? [],
    ),
    quoteWorkflowData: buildPolicyWorkflowCardData(
      countryRows,
      lapsedTab?.tableRows ?? [],
      pendingTab?.chartData ?? [],
    ),
  };
};
