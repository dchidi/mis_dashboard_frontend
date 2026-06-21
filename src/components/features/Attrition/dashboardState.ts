import {
  brandContributionData as baseBrandContributionData,
  brandContributionTotalQuotes,
  lapsedQuoteByCountryData as baseLapsedQuoteByCountryData,
  pendingQuoteByCountryData as basePendingQuoteByCountryData,
  petTypeMixData as basePetTypeMixData,
  petTypeMixTotalQuotes,
  premiumChannelSplitData as basePremiumChannelSplitData,
  premiumCurrencyOptions,
  premiumOverviewData as basePremiumOverviewData,
  productPerformanceData as baseProductPerformanceData,
  promoCodePerformanceData as basePromoCodePerformanceData,
  quoteByCountryData as baseQuoteByCountryData,
  trendData as baseTrendData,
  type BrandContributionDatum,
  type PendingQuoteByCountryDatum,
  type PetTypeMixDatum,
  type PremiumChannelSplitDatum,
  type PremiumCurrencyCode,
  type PremiumOverviewDatum,
  type ProductPerformanceDatum,
  type PromoCodePerformanceDatum,
  type QuoteAgingByCountryDatum,
  type QuoteByCountryDatum,
  type QuoteTrendDatum,
} from "./data";
import { getMetricViewDescriptor } from "./metricView";
import { trendSeriesOptions } from "./QuotePerformance/config";
import type { TrendSeriesKey } from "./QuotePerformance/types";

export interface QuoteDashboardFilters {
  brands: string[];
  countries: string[];
  petTypes: string[];
}

export interface QuoteDashboardDataBundle {
  brandContributionData: BrandContributionDatum[];
  lapsedQuoteByCountryData: QuoteAgingByCountryDatum[];
  pendingQuoteByCountryData: PendingQuoteByCountryDatum[];
  petTypeMixData: PetTypeMixDatum[];
  premiumChannelSplitData: PremiumChannelSplitDatum[];
  premiumOverviewData: PremiumOverviewDatum;
  productPerformanceData: ProductPerformanceDatum[];
  promoCodePerformanceData: PromoCodePerformanceDatum[];
  quoteByCountryData: QuoteByCountryDatum[];
  trendData: QuoteTrendDatum[];
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

export const metricFilterOptions: SelectionOption<TrendSeriesKey>[] =
  trendSeriesOptions.map((option) => ({
    label: getMetricViewDescriptor(option.key).buttonLabel,
    value: option.key,
  }));

const calculateConversionRate = (totalSales: number, totalQuote: number) =>
  totalQuote === 0 ? 0 : Number(((totalSales / totalQuote) * 100).toFixed(1));

const calculateShare = (value: number, total: number) =>
  total === 0 ? 0 : Number(((value / total) * 100).toFixed(1));

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
    totalQuote: scaleCount(row.totalQuote, scaleFactor),
  }));
  const totalQuote = scaledRows.reduce((sum, row) => sum + row.totalQuote, 0);

  return scaledRows.map((row) => ({
    ...row,
    quoteShare: calculateShare(row.totalQuote, totalQuote),
  }));
};

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

  return {
    brandContributionData: rebuildBrandData(filteredBrandRows, brandSupportScale),
    lapsedQuoteByCountryData: filteredLapsedRows.map((row) => ({
      ...row,
      bucket0To30: scaleCount(row.bucket0To30, countrySupportScale),
      bucket31To60: scaleCount(row.bucket31To60, countrySupportScale),
      bucket61To90: scaleCount(row.bucket61To90, countrySupportScale),
    })),
    pendingQuoteByCountryData: filteredPendingRows.map((row) => ({
      ...row,
      pendingQuotes: scaleCount(row.pendingQuotes, countrySupportScale),
    })),
    petTypeMixData: rebuildPetTypeData(filteredPetRows, petSupportScale),
    premiumChannelSplitData: rebuildPremiumChannelData(
      basePremiumChannelSplitData,
      globalScale,
    ),
    premiumOverviewData: {
      premiumConverted: scaleAmount(
        basePremiumOverviewData.premiumConverted,
        globalScale,
      ),
      premiumQuotedGwp: scaleAmount(
        basePremiumOverviewData.premiumQuotedGwp,
        globalScale,
      ),
    },
    productPerformanceData: baseProductPerformanceData.map((row) => ({
      ...row,
      convertedValue: scaleAmount(row.convertedValue, globalScale),
      convertedVolume: scaleCount(row.convertedVolume, globalScale),
      quotedValue: scaleAmount(row.quotedValue, globalScale),
      quotedVolume: scaleCount(row.quotedVolume, globalScale),
    })),
    promoCodePerformanceData: basePromoCodePerformanceData.map((row) => ({
      ...row,
      convertedVolume: scaleCount(row.convertedVolume, globalScale),
      quotedVolume: scaleCount(row.quotedVolume, globalScale),
    })),
    quoteByCountryData: rebuildCountryData(filteredCountryRows, countrySupportScale),
    trendData: scaleTrendData(baseTrendData, globalScale),
  };
};
