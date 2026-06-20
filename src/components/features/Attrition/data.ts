export interface AttritionPredictorDatum {
  attritionRate: number;
  cohortCount: number;
  predictor: string;
}

export interface QuoteByCountryDatum {
  conversionRate: number;
  country: string;
  growth: number;
  quoteShare: number;
  totalQuote: number;
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

export interface PremiumChannelSplitDatum {
  channel: "Contact Center" | "Web";
  contribution: number;
  fill: string;
  totalPremium: number;
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

export interface PromoCodePerformanceDatum {
  averageTimeToConvertDays: number;
  convertedVolume: number;
  promoCode: string;
  quotedVolume: number;
}

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
    quoteShare: 38.4,
    conversionRate: 3.1,
    growth: 12.4,
    totalQuote: 224,
  },
  {
    country: "Sweden",
    quoteShare: 22.7,
    conversionRate: 2.8,
    growth: 8.1,
    totalQuote: 132,
  },
  {
    country: "Ireland",
    quoteShare: 16.8,
    conversionRate: 2.5,
    growth: -2.6,
    totalQuote: 98,
  },
  {
    country: "Germany",
    quoteShare: 12.6,
    conversionRate: 2.2,
    growth: 4.3,
    totalQuote: 74,
  },
  {
    country: "France",
    quoteShare: 9.5,
    conversionRate: 1.9,
    growth: -1.8,
    totalQuote: 55,
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
