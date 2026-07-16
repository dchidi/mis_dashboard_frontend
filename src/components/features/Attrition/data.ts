export interface AttritionPredictorDatum {
  attritionRate: number;
  cohortCount: number;
  predictor: string;
}

export interface QuoteByCountryDatum {
  conversionRate: number;
  country: string;
  countryCode: string;
  growth: number;
  quoteShare: number;
  salesShare: number;
  totalQuote: number;
  totalSales: number;
}

export interface QuoteByCountryViewRow extends QuoteByCountryDatum {
  metricLabel: string;
  metricValue: number;
}

export interface QuoteByCountryInsightDatum {
  id: string;
  label: string;
  note: string;
  tone: "negative" | "neutral" | "positive";
  value: string;
}

export interface QuoteByCountryViewData {
  chartData: QuoteByCountryViewRow[];
  insights: QuoteByCountryInsightDatum[];
  tableRows: QuoteByCountryViewRow[];
}

export interface QuoteByCountryCardData {
  conversionRate: QuoteByCountryViewData;
  totalQuote: QuoteByCountryViewData;
  totalSales: QuoteByCountryViewData;
}

export interface MetricKeyed<T> {
  conversionRate: T;
  totalQuote: T;
  totalSales: T;
}

export interface DashboardInsightDatum {
  id: string;
  label: string;
  note: string;
  tone: "negative" | "neutral" | "positive";
  value: string;
}

export interface QuoteAgingByCountryDatum {
  bucket0To30: number;
  bucket31To60: number;
  bucket61To90: number;
  country: string;
}

export interface PendingQuoteByCountryDatum {
  country: string;
  pendingQuotes: number;
}

export type PremiumCurrencyCode = "GBP" | "USD" | "EUR";

export interface PremiumCurrencyOption {
  code: PremiumCurrencyCode;
  label: string;
  rate: number;
  symbol: string;
}

export interface PremiumOverviewDatum {
  premiumConverted: number;
  premiumQuotedGwp: number;
}

export interface MetricDisplayRow {
  id: string;
  label: string;
  value: string;
}

export interface PremiumChannelSplitDatum {
  channel: "Contact Center" | "Web";
  contribution: number;
  fill: string;
  totalPremium: number;
}

export interface PremiumOverviewSectionDatum {
  accentColor: string;
  accentGlowRgb: string;
  channel: PremiumChannelSplitDatum["channel"];
  metricRows: MetricDisplayRow[];
  share: number;
  shareLabel: string;
}

export interface PremiumOverviewCardData {
  sections: PremiumOverviewSectionDatum[];
}

export interface QuoteTrendDatum {
  [key: string]: string | number;
  averageTimeToConvertDays: number;
  conversionRate: number;
  month: string;
  previousYearConversionRate: number;
  previousYearMonth: string;
  previousYearTotalQuote: number;
  previousYearTotalSales: number;
  totalQuote: number;
  totalSales: number;
}

export interface BrandContributionDatum {
  [key: string]: string | number;
  brand: string;
  fill: string;
  quoteCount: number;
  share: number;
  shareLabel: string;
}

export interface PetTypeMixDatum {
  [key: string]: string | number;
  fill: string;
  petType: string;
  quoteCount: number;
  share: number;
  shareLabel: string;
}

export interface ProductRankingDatum {
  metricValue: number;
  product: string;
  share: number;
}

export interface ProductPerformanceDatum {
  convertedValue: number;
  convertedVolume: number;
  product: string;
  quotedValue: number;
  quotedVolume: number;
}

export type ProductMetricTabKey = "value" | "volume";

export interface ProductPerformanceRowData {
  fillPercent: number;
  metaDisplay: string;
  metricDisplay: string;
  product: string;
  rankLabel: string;
}

export interface ProductPerformanceViewData {
  accentRgb: string;
  rows: ProductPerformanceRowData[];
  summaryValue: string;
  title: string;
}

export interface ProductPerformanceCardData {
  value: MetricKeyed<ProductPerformanceViewData>;
  volume: MetricKeyed<ProductPerformanceViewData>;
}

export interface PromoCodePerformanceDatum {
  averageTimeToConvertDays: number;
  convertedVolume: number;
  promoCode: string;
  quotedVolume: number;
}

export interface AgentPerformanceDatum {
  agent: string;
  averageTimeToConvertDays: number;
  convertedVolume: number;
  quotedVolume: number;
}

export type PromoCardTabKey = "promo-code" | "agent";

export interface PromoPerformanceTableRow {
  averageTimeToConvertLabel: string;
  conversionRateLabel: string;
  convertedShareLabel: string;
  convertedVolumeLabel: string;
  id: string;
  label: string;
  quotedShareLabel: string;
  quotedVolumeLabel: string;
}

export interface PromoPerformanceViewData {
  firstColumnHeader: string;
  rows: PromoPerformanceTableRow[];
  title: string;
}

export interface QuoteByPromoCodeCardData {
  agent: MetricKeyed<PromoPerformanceViewData>;
  promoCode: MetricKeyed<PromoPerformanceViewData>;
}

export type QuoteWorkflowTabKey = string;

export interface LapsedQuoteBucketDatum {
  color: string;
  key: "bucket0To30" | "bucket31To60" | "bucket61To90";
  label: string;
}

export interface WorkflowBarChartDatum {
  [key: string]: string | number;
  country: string;
  countryCode: string;
  fill: string;
  value: number;
  valueLabel: string;
}

export interface WorkflowReasonTableRow {
  count: number;
  id: string;
  reason: string;
  share: number;
  yoyChange: number;
  yoyTrend: "down" | "flat" | "up";
}

export interface LapsedQuoteChartDatum extends QuoteAgingByCountryDatum {
  countryCode: string;
  total: number;
}

export interface QuoteWorkflowBaseViewData {
  accentRgb: string;
  insights: DashboardInsightDatum[];
  key: QuoteWorkflowTabKey;
  label: string;
  metricLabel: string;
  subtitle: string;
  title: string;
}

export interface LapsedQuoteWorkflowViewData
  extends QuoteWorkflowBaseViewData {
  buckets: LapsedQuoteBucketDatum[];
  chartData: LapsedQuoteChartDatum[];
  kind: "lapsed";
  tableRows: QuoteAgingByCountryDatum[];
}

export interface WorkflowBarViewData
  extends QuoteWorkflowBaseViewData {
  chartData: WorkflowBarChartDatum[];
  kind: "bar";
  numericTickKind?: "count" | "percent";
  reasonTableRows?: WorkflowReasonTableRow[];
  reasonTableShare?: number;
}

export type QuoteWorkflowViewData =
  | LapsedQuoteWorkflowViewData
  | WorkflowBarViewData;

export interface QuoteWorkflowCardData {
  idBase?: string;
  title?: string;
  tabs: QuoteWorkflowViewData[];
}

export interface QuoteMetricCellData {
  display: string;
  tone: "negative" | "neutral" | "positive";
  trend: "down" | "flat" | "up";
}

export interface QuoteMetricTableRowData {
  id: string;
  label: string;
  values: QuoteMetricCellData[];
}

export interface QuoteMetricTableData {
  months: string[];
  rows: QuoteMetricTableRowData[];
}

export type QuotePerformanceViewKey =
  | "quote-trend"
  | "cumulative-trend"
  | "conversion-trend"
  | "brand-contribution"
  | "pet-type-mix";

export interface QuotePerformanceSignalData {
  ariaLabel: string;
  direction: "down" | "flat" | "up";
  kind: "dot" | "trend";
  label: string;
  tone: "cool" | "negative" | "neutral" | "positive" | "warm";
  value: string;
}

export interface QuotePerformanceAlertData {
  id: string;
  severity: "high" | "low" | "medium";
  text: string;
  tone: "exception" | "risk" | "trend";
}

export interface QuotePerformanceAnalysisData {
  activeAnalysisAlerts: QuotePerformanceAlertData[];
  activeAnalysisSummary: string[];
  analysisSpotlightLabel: string;
  analysisSpotlightMeta: string;
  analysisSpotlightTone: "cool" | "negative" | "neutral" | "positive" | "warm";
  analysisSpotlightValue: string;
  insightAccentRgb: string;
}

export interface QuotePerformanceBaseTabData {
  accentRgb: string;
  analysis: QuotePerformanceAnalysisData;
  key: QuotePerformanceViewKey;
  label: string;
  panelTitle: string;
  signal: QuotePerformanceSignalData;
  subtitle: string;
  title: string;
}

export interface QuoteTrendPerformanceTabData
  extends QuotePerformanceBaseTabData {
  kind: "quote-trend";
  metricsTable: QuoteMetricTableData;
  trendData: QuoteTrendDatum[];
  trendSeriesKey: "conversionRate" | "totalQuote" | "totalSales";
}

export interface ConversionTrendPerformanceTabData
  extends QuotePerformanceBaseTabData {
  kind: "conversion-trend";
  metricsTable: QuoteMetricTableData;
  trendData: QuoteTrendDatum[];
}

export interface CumulativeTrendDatum {
  [key: string]: string | number;
  currentCumulative: number;
  month: string;
  previousYearCumulative: number;
}

export interface CumulativeTrendPerformanceTabData
  extends QuotePerformanceBaseTabData {
  kind: "cumulative-trend";
  metricsTable: QuoteMetricTableData;
  trendData: CumulativeTrendDatum[];
  yAxisWidth?: number;
}

export interface BrandContributionPerformanceTabData
  extends QuotePerformanceBaseTabData {
  brandData: BrandContributionDatum[];
  kind: "brand-contribution";
}

export interface PetTypeMixPerformanceTabData
  extends QuotePerformanceBaseTabData {
  kind: "pet-type-mix";
  petTypeData: PetTypeMixDatum[];
  totalQuote: number;
}

export type QuotePerformanceTabData =
  | BrandContributionPerformanceTabData
  | ConversionTrendPerformanceTabData
  | CumulativeTrendPerformanceTabData
  | PetTypeMixPerformanceTabData
  | QuoteTrendPerformanceTabData;

export interface QuotePerformanceMetricViewData {
  tabs: QuotePerformanceTabData[];
}

export interface QuotePerformanceCardData
  extends MetricKeyed<QuotePerformanceMetricViewData> {}

export interface AttritionDepartmentDatum {
  [key: string]: string | number;
  attritionRate: number;
  department: string;
  fill: string;
  totalAttrition: number;
}

export interface AttritionGradeBandDatum {
  [key: string]: string | number;
  attritionRate: number;
  gradeBand: string;
  rateLabel: string;
  totalAttrition: number;
}

export const predictorData: AttritionPredictorDatum[] = [
  {
    predictor: "Tenure under 12 months",
    cohortCount: 84,
    attritionRate: 6.8,
  },
  {
    predictor: "No salary review in 12 months",
    cohortCount: 61,
    attritionRate: 5.7,
  },
  {
    predictor: "No promotion in 24 months",
    cohortCount: 47,
    attritionRate: 5.1,
  },
  {
    predictor: "Frequent overtime",
    cohortCount: 38,
    attritionRate: 4.9,
  },
  {
    predictor: "Recent manager change",
    cohortCount: 29,
    attritionRate: 4.2,
  },
];

export const quoteByCountryData: QuoteByCountryDatum[] = [
  {
    country: "UK",
    countryCode: "UK",
    quoteShare: 38.4,
    salesShare: 43.8,
    conversionRate: 3.1,
    growth: 12.4,
    totalQuote: 224,
    totalSales: 7,
  },
  {
    country: "Sweden",
    countryCode: "SE",
    quoteShare: 22.7,
    salesShare: 25,
    conversionRate: 2.8,
    growth: 8.1,
    totalQuote: 132,
    totalSales: 4,
  },
  {
    country: "Ireland",
    countryCode: "IE",
    quoteShare: 16.8,
    salesShare: 12.5,
    conversionRate: 2.5,
    growth: -2.6,
    totalQuote: 98,
    totalSales: 2,
  },
  {
    country: "Germany",
    countryCode: "DE",
    quoteShare: 12.6,
    salesShare: 12.5,
    conversionRate: 2.2,
    growth: 4.3,
    totalQuote: 74,
    totalSales: 2,
  },
  {
    country: "France",
    countryCode: "FR",
    quoteShare: 9.5,
    salesShare: 6.3,
    conversionRate: 1.9,
    growth: -1.8,
    totalQuote: 55,
    totalSales: 1,
  },
];

export const lapsedQuoteByCountryData: QuoteAgingByCountryDatum[] = [
  {
    country: "UK",
    bucket0To30: 42,
    bucket31To60: 28,
    bucket61To90: 17,
  },
  {
    country: "Sweden",
    bucket0To30: 31,
    bucket31To60: 21,
    bucket61To90: 13,
  },
  {
    country: "Ireland",
    bucket0To30: 24,
    bucket31To60: 16,
    bucket61To90: 11,
  },
  {
    country: "Germany",
    bucket0To30: 18,
    bucket31To60: 14,
    bucket61To90: 9,
  },
  {
    country: "France",
    bucket0To30: 15,
    bucket31To60: 10,
    bucket61To90: 8,
  },
];

export const pendingQuoteByCountryData: PendingQuoteByCountryDatum[] = [
  {
    country: "UK",
    pendingQuotes: 58,
  },
  {
    country: "Sweden",
    pendingQuotes: 41,
  },
  {
    country: "Ireland",
    pendingQuotes: 33,
  },
  {
    country: "Germany",
    pendingQuotes: 26,
  },
  {
    country: "France",
    pendingQuotes: 20,
  },
];

export const premiumCurrencyOptions: PremiumCurrencyOption[] = [
  {
    code: "GBP",
    label: "GBP",
    rate: 1,
    symbol: "\u00A3",
  },
  {
    code: "USD",
    label: "USD",
    rate: 1.28,
    symbol: "$",
  },
  {
    code: "EUR",
    label: "EUR",
    rate: 1.17,
    symbol: "\u20AC",
  },
];

export const premiumOverviewData: PremiumOverviewDatum = {
  premiumQuotedGwp: 2_340_000,
  premiumConverted: 1_410_000,
};

const premiumChannelSplitBaseData = [
  {
    channel: "Web" as const,
    fill: "#4e8df5",
    totalPremium: 1_460_000,
  },
  {
    channel: "Contact Center" as const,
    fill: "#33b18b",
    totalPremium: 880_000,
  },
];

const premiumChannelTotal = premiumChannelSplitBaseData.reduce(
  (sum, entry) => sum + entry.totalPremium,
  0,
);

export const premiumChannelSplitData: PremiumChannelSplitDatum[] =
  premiumChannelSplitBaseData.map((entry) => ({
    ...entry,
    contribution:
      premiumChannelTotal === 0
        ? 0
        : Number(((entry.totalPremium / premiumChannelTotal) * 100).toFixed(1)),
  }));

interface QuoteTrendBaseDatum {
  averageTimeToConvertDays: number;
  month: string;
  previousYearMonth: string;
  previousYearTotalQuote: number;
  previousYearTotalSales: number;
  totalQuote: number;
  totalSales: number;
}

const calculateConversionRate = (totalSales: number, totalQuote: number) =>
  totalQuote === 0 ? 0 : Number(((totalSales / totalQuote) * 100).toFixed(1));

const calculateShare = (value: number, total: number) =>
  total === 0 ? 0 : Number(((value / total) * 100).toFixed(1));

const trendBaseData: QuoteTrendBaseDatum[] = [
  {
    averageTimeToConvertDays: 17,
    month: "Jan 25",
    previousYearMonth: "Jan 24",
    totalQuote: 585,
    totalSales: 24,
    previousYearTotalQuote: 548,
    previousYearTotalSales: 20,
  },
  {
    averageTimeToConvertDays: 15,
    month: "Feb 25",
    previousYearMonth: "Feb 24",
    totalQuote: 600,
    totalSales: 18,
    previousYearTotalQuote: 563,
    previousYearTotalSales: 19,
  },
  {
    averageTimeToConvertDays: 18,
    month: "Mar 25",
    previousYearMonth: "Mar 24",
    totalQuote: 600,
    totalSales: 12,
    previousYearTotalQuote: 571,
    previousYearTotalSales: 14,
  },
  {
    averageTimeToConvertDays: 14,
    month: "Apr 25",
    previousYearMonth: "Apr 24",
    totalQuote: 572,
    totalSales: 16,
    previousYearTotalQuote: 539,
    previousYearTotalSales: 13,
  },
  {
    averageTimeToConvertDays: 12,
    month: "May 25",
    previousYearMonth: "May 24",
    totalQuote: 590,
    totalSales: 23,
    previousYearTotalQuote: 554,
    previousYearTotalSales: 20,
  },
  {
    averageTimeToConvertDays: 13,
    month: "Jun 25",
    previousYearMonth: "Jun 24",
    totalQuote: 583,
    totalSales: 14,
    previousYearTotalQuote: 547,
    previousYearTotalSales: 12,
  },
];

export const trendData: QuoteTrendDatum[] = trendBaseData.map((entry) => {
  const conversionRate = calculateConversionRate(
    entry.totalSales,
    entry.totalQuote,
  );
  const previousYearConversionRate = calculateConversionRate(
    entry.previousYearTotalSales,
    entry.previousYearTotalQuote,
  );

  return {
    ...entry,
    conversionRate,
    previousYearConversionRate,
  };
});

const brandContributionBaseData = [
  {
    brand: "Petcover",
    fill: "#d76853",
    quoteCount: 186,
  },
  {
    brand: "BPIS",
    fill: "#e29a45",
    quoteCount: 154,
  },
  {
    brand: "CoveryMy",
    fill: "#4e8df5",
    quoteCount: 132,
  },
  {
    brand: "BB Commercial",
    fill: "#33b18b",
    quoteCount: 108,
  },
  {
    brand: "Exotic Direct",
    fill: "#8a74e8",
    quoteCount: 81,
  },
  {
    brand: "Petcover Professional",
    fill: "#d75f9b",
    quoteCount: 64,
  },
];

export const brandContributionTotalQuotes = brandContributionBaseData.reduce(
  (sum, entry) => sum + entry.quoteCount,
  0,
);

export const brandContributionData: BrandContributionDatum[] =
  brandContributionBaseData.map((entry) => {
    const share = calculateShare(entry.quoteCount, brandContributionTotalQuotes);

    return {
      ...entry,
      share,
      shareLabel: `${share}%`,
    };
  });

export const topBrandContribution =
  brandContributionData.reduce<BrandContributionDatum | null>(
    (topEntry, entry) =>
      !topEntry || entry.quoteCount > topEntry.quoteCount ? entry : topEntry,
    null,
  );

const petTypeMixBaseData = [
  {
    petType: "Dogs",
    fill: "#c05a52",
    quoteCount: 214,
  },
  {
    petType: "Cats",
    fill: "#4e8df5",
    quoteCount: 168,
  },
  {
    petType: "Exotics",
    fill: "#33b18b",
    quoteCount: 97,
  },
  {
    petType: "Horses",
    fill: "#d7a13d",
    quoteCount: 72,
  },
  {
    petType: "Exotic Direct",
    fill: "#8a74e8",
    quoteCount: 64,
  },
  {
    petType: "BB Commercial",
    fill: "#d76853",
    quoteCount: 48,
  },
  {
    petType: "Petcover Professional",
    fill: "#d75f9b",
    quoteCount: 36,
  },
];

export const petTypeMixTotalQuotes = petTypeMixBaseData.reduce(
  (sum, entry) => sum + entry.quoteCount,
  0,
);

export const petTypeMixData: PetTypeMixDatum[] = petTypeMixBaseData.map(
  (entry) => {
    const share = calculateShare(entry.quoteCount, petTypeMixTotalQuotes);

    return {
      ...entry,
      share,
      shareLabel: `${share}%`,
    };
  },
);

export const topPetTypeMix = petTypeMixData.reduce<PetTypeMixDatum | null>(
  (topEntry, entry) =>
    !topEntry || entry.quoteCount > topEntry.quoteCount ? entry : topEntry,
  null,
);

export const productPerformanceData: ProductPerformanceDatum[] = [
  {
    product: "Premier Plus",
    quotedVolume: 224,
    convertedVolume: 8,
    quotedValue: 620_000,
    convertedValue: 24_800,
  },
  {
    product: "Essential Cover",
    quotedVolume: 186,
    convertedVolume: 5,
    quotedValue: 410_000,
    convertedValue: 12_300,
  },
  {
    product: "Lifetime Elite",
    quotedVolume: 162,
    convertedVolume: 7,
    quotedValue: 540_000,
    convertedValue: 20_500,
  },
  {
    product: "Multi-Pet",
    quotedVolume: 154,
    convertedVolume: 6,
    quotedValue: 430_000,
    convertedValue: 15_400,
  },
  {
    product: "Annual Flex",
    quotedVolume: 128,
    convertedVolume: 4,
    quotedValue: 335_000,
    convertedValue: 10_100,
  },
  {
    product: "Vet Protect",
    quotedVolume: 97,
    convertedVolume: 4,
    quotedValue: 280_000,
    convertedValue: 11_200,
  },
  {
    product: "Accident Only",
    quotedVolume: 88,
    convertedVolume: 2,
    quotedValue: 160_000,
    convertedValue: 3_600,
  },
];

export const promoCodePerformanceData: PromoCodePerformanceDatum[] = [
  {
    averageTimeToConvertDays: 12,
    promoCode: "WELCOME10",
    quotedVolume: 154,
    convertedVolume: 6,
  },
  {
    averageTimeToConvertDays: 14,
    promoCode: "MULTIPET20",
    quotedVolume: 132,
    convertedVolume: 5,
  },
  {
    averageTimeToConvertDays: 16,
    promoCode: "SAVE15",
    quotedVolume: 118,
    convertedVolume: 4,
  },
  {
    averageTimeToConvertDays: 11,
    promoCode: "LOYALTY5",
    quotedVolume: 96,
    convertedVolume: 4,
  },
  {
    averageTimeToConvertDays: 13,
    promoCode: "SPRING25",
    quotedVolume: 84,
    convertedVolume: 3,
  },
  {
    averageTimeToConvertDays: 18,
    promoCode: "APPONLY",
    quotedVolume: 71,
    convertedVolume: 2,
  },
  {
    averageTimeToConvertDays: 15,
    promoCode: "NEWYEAR20",
    quotedVolume: 64,
    convertedVolume: 2,
  },
  {
    averageTimeToConvertDays: 10,
    promoCode: "BUNDLE12",
    quotedVolume: 58,
    convertedVolume: 3,
  },
  {
    averageTimeToConvertDays: 17,
    promoCode: "REFERFRIEND",
    quotedVolume: 52,
    convertedVolume: 1,
  },
  {
    averageTimeToConvertDays: 14,
    promoCode: "PETCARE7",
    quotedVolume: 47,
    convertedVolume: 2,
  },
];

export const agentPerformanceData: AgentPerformanceDatum[] = [
  {
    agent: "Amara D",
    averageTimeToConvertDays: 11,
    quotedVolume: 148,
    convertedVolume: 7,
  },
  {
    agent: "Liam K",
    averageTimeToConvertDays: 13,
    quotedVolume: 136,
    convertedVolume: 6,
  },
  {
    agent: "Sophia M",
    averageTimeToConvertDays: 12,
    quotedVolume: 121,
    convertedVolume: 5,
  },
  {
    agent: "Noah R",
    averageTimeToConvertDays: 15,
    quotedVolume: 114,
    convertedVolume: 4,
  },
  {
    agent: "Olivia T",
    averageTimeToConvertDays: 10,
    quotedVolume: 102,
    convertedVolume: 5,
  },
  {
    agent: "Ethan B",
    averageTimeToConvertDays: 16,
    quotedVolume: 91,
    convertedVolume: 3,
  },
  {
    agent: "Isla C",
    averageTimeToConvertDays: 14,
    quotedVolume: 84,
    convertedVolume: 3,
  },
  {
    agent: "Mason F",
    averageTimeToConvertDays: 17,
    quotedVolume: 76,
    convertedVolume: 2,
  },
  {
    agent: "Ava J",
    averageTimeToConvertDays: 12,
    quotedVolume: 69,
    convertedVolume: 3,
  },
  {
    agent: "Leo S",
    averageTimeToConvertDays: 18,
    quotedVolume: 58,
    convertedVolume: 2,
  },
];

export const departmentData: AttritionDepartmentDatum[] = [
  {
    department: "Operations",
    totalAttrition: 18,
    attritionRate: 4.3,
    fill: "#df4336",
  },
  {
    department: "Sales",
    totalAttrition: 16,
    attritionRate: 3.8,
    fill: "#23b5a7",
  },
  {
    department: "Support",
    totalAttrition: 12,
    attritionRate: 2.9,
    fill: "#4e8df5",
  },
  {
    department: "Finance",
    totalAttrition: 9,
    attritionRate: 2.1,
    fill: "#d7a13d",
  },
];

export const departmentTotalAttrition = departmentData.reduce(
  (sum, department) => sum + department.totalAttrition,
  0,
);

export const gradeBandData: AttritionGradeBandDatum[] = [
  {
    gradeBand: "G1-G2",
    attritionRate: 1.8,
    totalAttrition: 7,
    rateLabel: "1.8%",
  },
  {
    gradeBand: "G3-G4",
    attritionRate: 2.6,
    totalAttrition: 11,
    rateLabel: "2.6%",
  },
  {
    gradeBand: "G5-G6",
    attritionRate: 3.7,
    totalAttrition: 15,
    rateLabel: "3.7%",
  },
  {
    gradeBand: "G7+",
    attritionRate: 2.2,
    totalAttrition: 8,
    rateLabel: "2.2%",
  },
];
