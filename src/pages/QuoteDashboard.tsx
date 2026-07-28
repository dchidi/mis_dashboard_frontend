import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  PremiumOverview,
  ProductPerformance,
  QuoteByCountry,
  QuoteByPromoCode,
  QuoteWorkflow,
  QuoteTrend,
} from "../components/features/Attrition";
import {
  brandFilterOptions,
  buildQuoteDashboardData,
  countryFilterOptions,
  currencyFilterOptions,
  metricFilterOptions,
  petTypeFilterOptions,
  type QuoteDashboardDataBundle,
  type SelectionOption,
} from "../components/features/Attrition/dashboardState";
import type { PremiumCurrencyCode } from "../components/features/Attrition/data";
import type { TrendSeriesKey } from "../components/features/Attrition/QuotePerformance/types";
import DashboardLayout, {
  type DashboardDateRange,
} from "../components/layout/DashboardLayout/DashboardLayout";
import Card from "../components/ui/card/Card";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import V2EtlModal from "../components/ui/etl_modal/V2EtlModal";
import Skeleton from "../components/ui/skeleton";
import { dashboardMenuItems } from "../config/dashboardMenu";
import { useAuth } from "../context/AuthContext";
import { useV2EtlDataRevision } from "../features/etl/dataRefresh";
import { useV2EtlRunner } from "../features/etl/useV2EtlRunner";
import {
  downloadQuoteCountry,
  downloadQuoteProductPerformance,
  downloadQuotePromoPerformance,
  downloadQuoteWorkflow,
  fetchQuoteDashboard,
  fetchQuoteFilters,
  type QuoteFilterOption,
} from "../services/quoteV2";
import { getUserNameParts } from "../utils/auth";
import style from "./page_css/QuoteDashboard.module.css";

interface DashboardChartViewProps {
  activeTrendSeriesKey: TrendSeriesKey;
  dashboardData: QuoteDashboardDataBundle;
  isCountryDownloadInProgress: boolean;
  isLoading: boolean;
  isPromoPerformanceDownloadInProgress: boolean;
  isProductPerformanceDownloadInProgress: boolean;
  isWorkflowDownloadInProgress: boolean;
  onCountryDownload: () => void;
  onWorkflowDownload: () => void;
  onPromoPerformanceDownload: (view: "promoCode" | "agent") => void;
  onProductPerformanceDownload: () => void;
  onTrendSeriesChange: (key: TrendSeriesKey) => void;
  reportingPeriodLabel: string;
}

interface QuoteFilterOptionsState {
  brands: QuoteFilterOption[];
  countries: QuoteFilterOption[];
  petTypes: QuoteFilterOption[];
}

interface SkeletonCardProps {
  children: React.ReactNode;
  className?: string;
  headerAside?: React.ReactNode;
  title: string;
}

const defaultDashboardEndDate = dayjs().subtract(1, "day");
const defaultReportingPeriod: DashboardDateRange = [
  defaultDashboardEndDate.format("YYYY-MM-DD"),
  defaultDashboardEndDate.format("YYYY-MM-DD"),
];
const defaultQuotePerformancePeriod: DashboardDateRange = [
  defaultDashboardEndDate.startOf("month").format("YYYY-MM-DD"),
  defaultDashboardEndDate.format("YYYY-MM-DD"),
];

const ZERO_PRESERVED_STRING_KEYS = new Set([
  "accentColor",
  "accentGlowRgb",
  "accentRgb",
  "ariaLabel",
  "channel",
  "color",
  "country",
  "countryCode",
  "description",
  "direction",
  "fill",
  "firstColumnHeader",
  "id",
  "key",
  "kind",
  "label",
  "month",
  "note",
  "panelTitle",
  "previousYearMonth",
  "product",
  "promoCode",
  "reason",
  "severity",
  "subtitle",
  "text",
  "title",
  "tone",
]);

const ZERO_CLEARED_ARRAY_KEYS = new Set([
  "activeAnalysisAlerts",
  "activeAnalysisSummary",
  "insights",
]);

const mapSelectionOptionsToFilterOptions = (
  options: SelectionOption<string>[],
): QuoteFilterOption[] =>
  options.map((option) => ({
    label: option.label,
    value: option.value,
  }));

const staticQuoteFilterOptions: QuoteFilterOptionsState = {
  brands: mapSelectionOptionsToFilterOptions(brandFilterOptions),
  countries: mapSelectionOptionsToFilterOptions(countryFilterOptions),
  petTypes: mapSelectionOptionsToFilterOptions(petTypeFilterOptions),
};

const getFilterOptionValues = (options: QuoteFilterOption[]) =>
  options.map((option) => option.value);

const areSameValueLists = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const reconcileDashboardSelection = (
  selectedValues: string[],
  availableOptions: QuoteFilterOption[],
) => {
  if (!selectedValues.length) {
    return selectedValues;
  }

  const availableValues = new Set(getFilterOptionValues(availableOptions));
  const nextValues = Array.from(
    new Set(selectedValues.filter((value) => availableValues.has(value))),
  );

  if (!nextValues.length || nextValues.length === availableOptions.length) {
    return [];
  }

  return areSameValueLists(selectedValues, nextValues)
    ? selectedValues
    : nextValues;
};

const mapFilterOptionsToSelectionOptions = (
  options: QuoteFilterOption[],
): SelectionOption<string>[] =>
  options.map((option) => ({
    label: option.label,
    value: option.value,
  }));

const toZeroDisplayPart = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const currencySymbol = trimmed.match(/^[\u00A3$\u20AC]/)?.[0];
  if (currencySymbol) {
    return `${currencySymbol}0`;
  }

  if (/^[+-]?[\d,.]+%$/i.test(trimmed)) {
    return "0%";
  }

  if (/^[+-]?[\d,.]+d$/i.test(trimmed)) {
    return "0d";
  }

  if (/^[+-]?[\d,.]+(?:[KMB])?$/i.test(trimmed)) {
    return "0";
  }

  if (/^[+-]?[\d,.]+\s+[A-Za-z]+$/i.test(trimmed)) {
    return trimmed.replace(/^[+-]?[\d,.]+/, "0");
  }

  if (/^[A-Za-z][A-Za-z\s]+\s+[+-]?[\d,.]+%$/i.test(trimmed)) {
    return trimmed.replace(/[+-]?[\d,.]+%$/i, "0%");
  }

  return "0";
};

const toZeroDisplayString = (value: string) => {
  if (value.includes("|")) {
    return value
      .split("|")
      .map((part) => toZeroDisplayPart(part))
      .join(" | ");
  }

  return toZeroDisplayPart(value);
};

const zeroDashboardValue = <T,>(value: T, parentKey?: string): T => {
  if (typeof value === "number") {
    return 0 as T;
  }

  if (typeof value === "string") {
    if (ZERO_PRESERVED_STRING_KEYS.has(parentKey ?? "")) {
      return value;
    }

    if (!/[0-9\u00A3$\u20AC%]/.test(value)) {
      return value;
    }

    return toZeroDisplayString(value) as T;
  }

  if (Array.isArray(value)) {
    if (ZERO_CLEARED_ARRAY_KEYS.has(parentKey ?? "")) {
      return [] as T;
    }

    return value.map((entry) => zeroDashboardValue(entry, parentKey)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        zeroDashboardValue(entry, key),
      ]),
    ) as T;
  }

  return value;
};

const createZeroDashboardBundle = (
  bundle: QuoteDashboardDataBundle,
): QuoteDashboardDataBundle => zeroDashboardValue(bundle);

const mergeDashboardBundle = (
  fallbackBundle: QuoteDashboardDataBundle,
  liveBundle: QuoteDashboardDataBundle,
): QuoteDashboardDataBundle => ({
  premiumOverviewData:
    liveBundle.premiumOverviewData.sections.length > 0
      ? liveBundle.premiumOverviewData
      : fallbackBundle.premiumOverviewData,
  productPerformanceData:
    liveBundle.productPerformanceData.volume.totalQuote.rows.length > 0
      ? liveBundle.productPerformanceData
      : fallbackBundle.productPerformanceData,
  promoCodePerformanceData:
    liveBundle.promoCodePerformanceData.promoCode.totalQuote.rows.length > 0
      ? liveBundle.promoCodePerformanceData
      : fallbackBundle.promoCodePerformanceData,
  quoteByCountryData:
    liveBundle.quoteByCountryData.totalQuote.tableRows.length > 0 ||
    liveBundle.quoteByCountryData.totalSales.tableRows.length > 0 ||
    liveBundle.quoteByCountryData.conversionRate.tableRows.length > 0
      ? liveBundle.quoteByCountryData
      : fallbackBundle.quoteByCountryData,
  quotePerformanceData:
    liveBundle.quotePerformanceData.totalQuote.tabs.length > 0
      ? liveBundle.quotePerformanceData
      : fallbackBundle.quotePerformanceData,
  quoteWorkflowData:
    liveBundle.quoteWorkflowData.tabs.length > 0
      ? liveBundle.quoteWorkflowData
      : fallbackBundle.quoteWorkflowData,
});

const SkeletonCard: React.FC<SkeletonCardProps> = ({
  children,
  className,
  headerAside,
  title,
}) => (
  <Card className={className}>
    <div className={style.skeletonCard}>
      <div className={style.skeletonHeader}>
        <div className="cardTitle">{title}</div>
        {headerAside}
      </div>
      {children}
    </div>
  </Card>
);

const QuoteByCountrySkeleton: React.FC<{
  className?: string;
  title: string;
}> = ({ className, title }) => (
  <SkeletonCard
    className={className}
    headerAside={<Skeleton className={style.skeletonIcon} />}
    title={title}
  >
    <div className={style.skeletonCountryChart}>
      {[86, 58, 41, 28, 18].map((height, index) => (
        <div className={style.skeletonCountryColumn} key={`${title}-${height}`}>
          <Skeleton
            className={style.skeletonCountryBar}
            style={{ height: `${height}%`, opacity: 1 - index * 0.08 }}
          />
          <Skeleton className={style.skeletonAxisLabel} />
        </div>
      ))}
    </div>
  </SkeletonCard>
);

const QuoteWorkflowSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <SkeletonCard
    className={className}
    headerAside={<Skeleton className={style.skeletonIcon} />}
    title="Quote Workflow"
  >
    <div className={style.skeletonPillRow}>
      <Skeleton className={style.skeletonPillActive} />
      <Skeleton className={style.skeletonPill} />
      <Skeleton className={style.skeletonPill} />
    </div>

    <div className={style.skeletonWorkflowBars}>
      {[88, 69, 54, 37, 24].map((width) => (
        <div className={style.skeletonWorkflowRow} key={`workflow-${width}`}>
          <Skeleton className={style.skeletonAxisLabel} />
          <Skeleton
            className={style.skeletonWorkflowBar}
            style={{ width: `${width}%` }}
          />
        </div>
      ))}
    </div>
  </SkeletonCard>
);

const PremiumOverviewSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <SkeletonCard className={className} title="Channel Distribution">
    <div className={style.skeletonPremiumStack}>
      {["Web", "Contact Center"].map((label) => (
        <div className={style.skeletonPremiumSection} key={label}>
          <div className={style.skeletonPremiumSectionHeader}>
            <Skeleton className={style.skeletonDot} />
            <div className={style.innerCardTitle}>{label}</div>
          </div>

          <div className={style.skeletonDonutWrap}>
            <Skeleton className={style.skeletonDonut} />
          </div>

          <div className={style.skeletonMetricTable}>
            {[1, 2, 3].map((row) => (
              <div className={style.skeletonMetricRow} key={`${label}-${row}`}>
                <Skeleton className={style.skeletonMetricLabel} />
                <Skeleton className={style.skeletonMetricValue} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </SkeletonCard>
);

const QuotePerformanceSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <SkeletonCard
    className={className}
    headerAside={<Skeleton className={style.skeletonSignal} />}
    title="Quote Performance"
  >
    <div className={style.skeletonPillRow}>
      <Skeleton className={style.skeletonPillActive} />
      <Skeleton className={style.skeletonPill} />
      <Skeleton className={style.skeletonPill} />
      <Skeleton className={style.skeletonPill} />
      <Skeleton className={style.skeletonPill} />
    </div>

    <div className={style.skeletonTrendPanel}>
      <div className={style.skeletonTrendToolbar}>
        <Skeleton className={style.skeletonIcon} />
      </div>
      <Skeleton className={style.skeletonTrendChart} />
    </div>
  </SkeletonCard>
);

const ProductPerformanceSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <SkeletonCard
    className={className}
    headerAside={<Skeleton className={style.skeletonSummary} />}
    title="Quote Volume by Product (Top 5)"
  >
    <div className={style.skeletonPillRow}>
      <Skeleton className={style.skeletonPillActive} />
      <Skeleton className={style.skeletonPill} />
    </div>

    <div className={style.skeletonProductList}>
      {[96, 84, 73, 60, 48].map((width, index) => (
        <div className={style.skeletonProductRow} key={`product-${width}`}>
          <div className={style.skeletonProductMeta}>
            <Skeleton className={style.skeletonProductLabel} />
            <Skeleton className={style.skeletonProductValue} />
          </div>
          <Skeleton
            className={style.skeletonProductBar}
            style={{ width: `${width}%`, opacity: 1 - index * 0.08 }}
          />
        </div>
      ))}
    </div>
  </SkeletonCard>
);

const QuoteByPromoSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <SkeletonCard
    className={className}
    headerAside={<Skeleton className={style.skeletonIcon} />}
    title="Quote by Promo Code (Top 10)"
  >
    <div className={style.skeletonPillRow}>
      <Skeleton className={style.skeletonWidePillActive} />
      <Skeleton className={style.skeletonWidePill} />
    </div>

    <div className={style.skeletonPromoTable}>
      <div className={style.skeletonPromoHeaderRow}>
        {[20, 12, 12, 12, 12, 12, 14].map((width, index) => (
          <Skeleton
            className={style.skeletonPromoHeaderCell}
            key={`promo-header-${index}`}
            style={{ width: `${width}%` }}
          />
        ))}
      </div>

      {[1, 2, 3, 4, 5, 6].map((row) => (
        <div className={style.skeletonPromoRow} key={`promo-row-${row}`}>
          {[18, 10, 10, 10, 10, 10, 16].map((width, index) => (
            <Skeleton
              className={style.skeletonPromoCell}
              key={`promo-cell-${row}-${index}`}
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  </SkeletonCard>
);

const renderChartView = ({
  activeTrendSeriesKey,
  dashboardData,
  isCountryDownloadInProgress,
  isLoading,
  isPromoPerformanceDownloadInProgress,
  isProductPerformanceDownloadInProgress,
  isWorkflowDownloadInProgress,
  onCountryDownload,
  onPromoPerformanceDownload,
  onWorkflowDownload,
  onProductPerformanceDownload,
  onTrendSeriesChange,
  reportingPeriodLabel,
}: DashboardChartViewProps) => (
  <div className={style.root}>
    {isLoading ? (
      <QuoteByCountrySkeleton
        className={`${style.section} ${style.countryCard}`}
        title={
          activeTrendSeriesKey === "conversionRate"
            ? "Conversion by Country"
            : activeTrendSeriesKey === "totalSales"
              ? "Sales by Country"
              : "Quote by Country"
        }
      />
    ) : (
      <QuoteByCountry
        activeTrendSeriesKey={activeTrendSeriesKey}
        className={`${style.section} ${style.countryCard}`}
        data={dashboardData.quoteByCountryData}
        downloadDisabled={isCountryDownloadInProgress}
        isDownloadInProgress={isCountryDownloadInProgress}
        onDownload={onCountryDownload}
        reportingPeriodLabel={reportingPeriodLabel}
      />
    )}

    {isLoading ? (
      <QuoteWorkflowSkeleton className={`${style.section} ${style.workflowCard}`} />
    ) : (
      <QuoteWorkflow
        className={`${style.section} ${style.workflowCard}`}
        data={dashboardData.quoteWorkflowData}
        downloadDisabled={isWorkflowDownloadInProgress}
        isDownloadInProgress={isWorkflowDownloadInProgress}
        onDownload={onWorkflowDownload}
        reportingPeriodLabel={reportingPeriodLabel}
      />
    )}

    {isLoading ? (
      <PremiumOverviewSkeleton className={`${style.section} ${style.premiumCard}`} />
    ) : (
      <PremiumOverview
        className={`${style.section} ${style.premiumCard}`}
        data={dashboardData.premiumOverviewData}
      />
    )}

    {isLoading ? (
      <QuotePerformanceSkeleton className={`${style.section} ${style.trendCard}`} />
    ) : (
      <QuoteTrend
        activeTrendSeriesKey={activeTrendSeriesKey}
        className={`${style.section} ${style.trendCard}`}
        data={dashboardData.quotePerformanceData}
        onTrendSeriesChange={onTrendSeriesChange}
      />
    )}

    {isLoading ? (
      <ProductPerformanceSkeleton className={`${style.section} ${style.productCard}`} />
    ) : (
      <ProductPerformance
        activeTrendSeriesKey={activeTrendSeriesKey}
        className={`${style.section} ${style.productCard}`}
        data={dashboardData.productPerformanceData}
        downloadDisabled={isProductPerformanceDownloadInProgress}
        isDownloadInProgress={isProductPerformanceDownloadInProgress}
        onDownload={onProductPerformanceDownload}
      />
    )}

    {isLoading ? (
      <QuoteByPromoSkeleton className={`${style.section} ${style.promoCard}`} />
    ) : (
      <QuoteByPromoCode
        activeTrendSeriesKey={activeTrendSeriesKey}
        className={`${style.section} ${style.promoCard}`}
        data={dashboardData.promoCodePerformanceData}
        downloadDisabled={isPromoPerformanceDownloadInProgress}
        isDownloadInProgress={isPromoPerformanceDownloadInProgress}
        onDownload={onPromoPerformanceDownload}
      />
    )}
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, logout, user } = useAuth();
  const etlRunner = useV2EtlRunner();
  const quoteEtlDataRevision = useV2EtlDataRevision("quote");
  const [activeTrendSeriesKey, setActiveTrendSeriesKey] =
    useState<TrendSeriesKey>("totalQuote");
  const [activeCurrencyCode, setActiveCurrencyCode] =
    useState<PremiumCurrencyCode>("GBP");
  const [reportingPeriod, setReportingPeriod] =
    useState<DashboardDateRange>(defaultReportingPeriod);
  const [isReportingPeriodCustomized, setIsReportingPeriodCustomized] =
    useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [filterOptions, setFilterOptions] = useState<QuoteFilterOptionsState>(
    staticQuoteFilterOptions,
  );
  const zeroDashboardData = useMemo(
    () =>
      createZeroDashboardBundle(
        buildQuoteDashboardData({
          brands: [],
          countries: [],
          petTypes: [],
        }),
      ),
    [],
  );
  const [dashboardData, setDashboardData] =
    useState<QuoteDashboardDataBundle>(zeroDashboardData);
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [isCountryDownloadInProgress, setIsCountryDownloadInProgress] =
    useState(false);
  const [isWorkflowDownloadInProgress, setIsWorkflowDownloadInProgress] =
    useState(false);
  const [isPromoPerformanceDownloadInProgress, setIsPromoPerformanceDownloadInProgress] =
    useState(false);
  const [isProductPerformanceDownloadInProgress, setIsProductPerformanceDownloadInProgress] =
    useState(false);
  const dashboardRequestIdRef = useRef(0);
  const brandRequestRef = useRef<AbortController | null>(null);
  const petTypeRequestRef = useRef<AbortController | null>(null);
  const { firstName, lastName } = getUserNameParts(user);

  const availableCountryOptions = useMemo(
    () => mapFilterOptionsToSelectionOptions(filterOptions.countries),
    [filterOptions.countries],
  );
  const availableBrandOptions = useMemo(
    () => mapFilterOptionsToSelectionOptions(filterOptions.brands),
    [filterOptions.brands],
  );
  const availablePetTypeOptions = useMemo(
    () => mapFilterOptionsToSelectionOptions(filterOptions.petTypes),
    [filterOptions.petTypes],
  );

  useEffect(() => {
    brandRequestRef.current?.abort();
    petTypeRequestRef.current?.abort();

    const abortController = new AbortController();

    void fetchQuoteFilters({ signal: abortController.signal })
      .then((filters) => {
        startTransition(() => {
          setFilterOptions({
            brands: filters.brands.length
              ? filters.brands
              : staticQuoteFilterOptions.brands,
            countries: filters.countries.length
              ? filters.countries
              : staticQuoteFilterOptions.countries,
            petTypes: filters.petTypes.length
              ? filters.petTypes
              : staticQuoteFilterOptions.petTypes,
          });
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load quote filters", error);
      });

    return () => {
      abortController.abort();
    };
  }, [quoteEtlDataRevision]);

  useEffect(() => {
    const [startDate, endDate] = reportingPeriod;
    const [performanceStartDate, performanceEndDate] =
      isReportingPeriodCustomized
        ? reportingPeriod
        : defaultQuotePerformancePeriod;
    if (
      !startDate ||
      !endDate ||
      !performanceStartDate ||
      !performanceEndDate
    ) {
      return;
    }

    const requestId = dashboardRequestIdRef.current + 1;
    dashboardRequestIdRef.current = requestId;
    setIsDashboardLoading(true);

    const abortController = new AbortController();

    void fetchQuoteDashboard({
      brands: selectedBrands,
      countryCodes: selectedCountries,
      endDate,
      performanceEndDate,
      performanceStartDate,
      petTypes: selectedPetTypes,
      signal: abortController.signal,
      startDate,
    })
      .then((payload) => {
        if (
          abortController.signal.aborted ||
          dashboardRequestIdRef.current !== requestId
        ) {
          return;
        }

        startTransition(() => {
          setDashboardData(mergeDashboardBundle(zeroDashboardData, payload.data));
          setIsDashboardLoading(false);
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to load quote dashboard", error);

        if (dashboardRequestIdRef.current !== requestId) {
          return;
        }

        startTransition(() => {
          setDashboardData(zeroDashboardData);
          setIsDashboardLoading(false);
        });
      });

    return () => {
      abortController.abort();
    };
  }, [
    isReportingPeriodCustomized,
    reportingPeriod,
    selectedBrands,
    selectedCountries,
    selectedPetTypes,
    quoteEtlDataRevision,
    zeroDashboardData,
  ]);

  const handleCountryChange = (nextCountries: string[]) => {
    setIsDashboardLoading(true);
    setSelectedCountries(nextCountries);

    brandRequestRef.current?.abort();
    petTypeRequestRef.current?.abort();

    const abortController = new AbortController();
    brandRequestRef.current = abortController;
    petTypeRequestRef.current = abortController;

    void (async () => {
      try {
        const brandScopedFilters = await fetchQuoteFilters({
          countryCodes: nextCountries,
          signal: abortController.signal,
        });

        const resolvedBrandOptions = brandScopedFilters.brands.length
          ? brandScopedFilters.brands
          : staticQuoteFilterOptions.brands;
        const resolvedCountryOptions = brandScopedFilters.countries.length
          ? brandScopedFilters.countries
          : staticQuoteFilterOptions.countries;
        const nextSelectedBrands = reconcileDashboardSelection(
          selectedBrands,
          resolvedBrandOptions,
        );

        let nextPetTypeOptions = brandScopedFilters.petTypes.length
          ? brandScopedFilters.petTypes
          : staticQuoteFilterOptions.petTypes;

        if (nextSelectedBrands.length) {
          const petTypeScopedFilters = await fetchQuoteFilters({
            brands: nextSelectedBrands,
            countryCodes: nextCountries,
            signal: abortController.signal,
          });
          nextPetTypeOptions = petTypeScopedFilters.petTypes.length
            ? petTypeScopedFilters.petTypes
            : staticQuoteFilterOptions.petTypes;
        }

        if (abortController.signal.aborted) {
          return;
        }

        startTransition(() => {
          setFilterOptions({
            brands: resolvedBrandOptions,
            countries: resolvedCountryOptions,
            petTypes: nextPetTypeOptions,
          });
          setSelectedBrands(nextSelectedBrands);
          setSelectedPetTypes((currentValues) =>
            reconcileDashboardSelection(currentValues, nextPetTypeOptions),
          );
        });
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to refresh quote brands", error);
      } finally {
        if (brandRequestRef.current === abortController) {
          brandRequestRef.current = null;
        }
        if (petTypeRequestRef.current === abortController) {
          petTypeRequestRef.current = null;
        }
      }
    })();
  };

  const handleBrandChange = (nextBrands: string[]) => {
    setIsDashboardLoading(true);
    setSelectedBrands(nextBrands);

    petTypeRequestRef.current?.abort();

    const abortController = new AbortController();
    petTypeRequestRef.current = abortController;

    void fetchQuoteFilters({
      brands: nextBrands,
      countryCodes: selectedCountries,
      signal: abortController.signal,
    })
      .then((filters) => {
        const resolvedPetTypeOptions = filters.petTypes.length
          ? filters.petTypes
          : staticQuoteFilterOptions.petTypes;

        startTransition(() => {
          setFilterOptions((currentOptions) => ({
            ...currentOptions,
            petTypes: resolvedPetTypeOptions,
          }));
          setSelectedPetTypes((currentValues) =>
            reconcileDashboardSelection(currentValues, resolvedPetTypeOptions),
          );
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Failed to refresh quote pet types", error);
      })
      .finally(() => {
        if (petTypeRequestRef.current === abortController) {
          petTypeRequestRef.current = null;
        }
      });
  };

  const handlePetTypeChange = (nextPetTypes: string[]) => {
    setIsDashboardLoading(true);
    setSelectedPetTypes(nextPetTypes);
  };

  const handleReportingPeriodChange = (nextReportingPeriod: DashboardDateRange) => {
    setIsDashboardLoading(true);
    setIsReportingPeriodCustomized(true);
    setReportingPeriod(nextReportingPeriod);
  };

  const handleCountryDownload = async () => {
    const [startDate, endDate] = reportingPeriod;
    if (!startDate || !endDate || isCountryDownloadInProgress) {
      return;
    }

    setIsCountryDownloadInProgress(true);
    try {
      await downloadQuoteCountry({
        brands: selectedBrands,
        countryCodes: selectedCountries,
        endDate,
        petTypes: selectedPetTypes,
        startDate,
      });
    } catch (error: unknown) {
      console.error("Failed to download Quote by Country workbook", error);
    } finally {
      setIsCountryDownloadInProgress(false);
    }
  };


  const handleWorkflowDownload = async () => {
    const [startDate, endDate] = reportingPeriod;
    if (!startDate || !endDate || isWorkflowDownloadInProgress) {
      return;
    }

    setIsWorkflowDownloadInProgress(true);
    try {
      await downloadQuoteWorkflow({
        brands: selectedBrands,
        countryCodes: selectedCountries,
        endDate,
        petTypes: selectedPetTypes,
        startDate,
      });
    } catch (error: unknown) {
      console.error("Failed to download Quote Workflow source data", error);
    } finally {
      setIsWorkflowDownloadInProgress(false);
    }
  };

  const handleProductPerformanceDownload = async () => {
    const [startDate, endDate] = reportingPeriod;
    if (!startDate || !endDate || isProductPerformanceDownloadInProgress) {
      return;
    }

    setIsProductPerformanceDownloadInProgress(true);
    try {
      await downloadQuoteProductPerformance({
        brands: selectedBrands,
        countryCodes: selectedCountries,
        endDate,
        petTypes: selectedPetTypes,
        startDate,
      });
    } catch (error: unknown) {
      console.error(
        "Failed to download quote product performance source data",
        error,
      );
    } finally {
      setIsProductPerformanceDownloadInProgress(false);
    }
  };

  const handlePromoPerformanceDownload = async (
    view: "promoCode" | "agent",
  ) => {
    const [startDate, endDate] = reportingPeriod;
    if (!startDate || !endDate || isPromoPerformanceDownloadInProgress) {
      return;
    }

    setIsPromoPerformanceDownloadInProgress(true);
    try {
      await downloadQuotePromoPerformance({
        brands: selectedBrands,
        countryCodes: selectedCountries,
        endDate,
        metricKey: activeTrendSeriesKey,
        petTypes: selectedPetTypes,
        startDate,
        view,
      });
    } catch (error: unknown) {
      console.error(
        `Failed to download quote ${view === "promoCode" ? "promo code" : "agent"} data`,
        error,
      );
    } finally {
      setIsPromoPerformanceDownloadInProgress(false);
    }
  };

  return (
    <>
      <DashboardLayout
        headerProfile={
          <DashboardProfileMenu
            activeCurrencyCode={activeCurrencyCode}
            activeMetricKey={activeTrendSeriesKey}
            availableBrands={availableBrandOptions}
            availableCountries={availableCountryOptions}
            availableCurrencies={currencyFilterOptions}
            availableMetrics={metricFilterOptions}
            availablePetTypes={availablePetTypeOptions}
            firstName={firstName}
            isEtlRunning={etlRunner.isEtlRunning}
            lastName={lastName}
            onActiveCurrencyChange={setActiveCurrencyCode}
            onActiveMetricChange={setActiveTrendSeriesKey}
            onBrandsChange={handleBrandChange}
            onCountriesChange={handleCountryChange}
            onManageUsers={() => navigate("/manage_users")}
            onLogout={logout}
            onPetTypesChange={handlePetTypeChange}
            onRunEtl={etlRunner.openModal}
            selectedBrands={selectedBrands}
            selectedCountries={selectedCountries}
            selectedPetTypes={selectedPetTypes}
            showManageUsersControl={isAdmin}
            showRunEtlControl={isAdmin}
          />
        }
        menuItems={dashboardMenuItems}
        onReportingPeriodChange={handleReportingPeriodChange}
        reportingPeriod={reportingPeriod}
        title="Quote Dashboard"
      >
        {renderChartView({
          activeTrendSeriesKey,
          dashboardData,
          isCountryDownloadInProgress,
          isLoading: isDashboardLoading,
          isPromoPerformanceDownloadInProgress,
          isProductPerformanceDownloadInProgress,
          isWorkflowDownloadInProgress,
          onCountryDownload: () => void handleCountryDownload(),
          onWorkflowDownload: () => void handleWorkflowDownload(),
          onPromoPerformanceDownload: (view) =>
            void handlePromoPerformanceDownload(view),
          onProductPerformanceDownload: () => void handleProductPerformanceDownload(),
          onTrendSeriesChange: setActiveTrendSeriesKey,
          reportingPeriodLabel:
            reportingPeriod[0] === reportingPeriod[1]
              ? dayjs(reportingPeriod[0]).format("DD MMM YYYY")
              : `${dayjs(reportingPeriod[0]).format("DD MMM YYYY")} to ${dayjs(
                  reportingPeriod[1],
                ).format("DD MMM YYYY")}`,
        })}
      </DashboardLayout>

      <V2EtlModal
        activeRouteOption={etlRunner.activeRouteOption}
        completedAt={etlRunner.completedAt}
        dateRange={etlRunner.dateRange}
        etlEvents={etlRunner.etlEvents}
        etlHeadline={etlRunner.etlHeadline}
        etlJobs={etlRunner.etlJobs}
        isOpen={etlRunner.isEtlModalOpen}
        isRunning={etlRunner.isEtlRunning}
        isStatusLoading={etlRunner.isStatusLoading}
        onClose={etlRunner.closeModal}
        onDateRangeChange={etlRunner.setDateRange}
        onResetDateRange={etlRunner.resetDateRange}
        onResetState={etlRunner.resetEtlState}
        onRun={() => void etlRunner.runSelectedEtl()}
        onSelectRoute={etlRunner.setSelectedRouteKey}
        routeOptions={etlRunner.routeOptions}
        selectedRouteKey={etlRunner.selectedRouteKey}
        startedAt={etlRunner.startedAt}
        statusError={etlRunner.statusError}
        statusSummary={etlRunner.statusSummary}
      />
    </>
  );
};

export default Dashboard;


