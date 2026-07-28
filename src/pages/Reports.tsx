import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import dayjs from "dayjs";
import { MultiSelect } from "@mantine/core";

import { useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  RiCheckLine,
  RiCloseLine,
  RiDatabase2Line,
  RiDownloadCloud2Line,
  RiFileTextLine,
  RiLineChartLine,
  RiLoader4Line,
  RiShieldCheckLine,
  RiSubtractLine,
} from "react-icons/ri";
import DashboardLayout, {
  type DashboardDateRange,
} from "../components/layout/DashboardLayout/DashboardLayout";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import SegmentedTabs, {
  type SegmentedTabOption,
} from "../components/ui/segmented_tabs";
import V2EtlModal from "../components/ui/etl_modal/V2EtlModal";
import ReportingPeriodPicker from "../components/ui/reporting_period_picker/ReportingPeriodPicker";
import { dashboardMenuItems } from "../config/dashboardMenu";
import {
  brandFilterOptions,
  countryFilterOptions,
  currencyFilterOptions,
  metricFilterOptions,
  petTypeFilterOptions,
  type SelectionOption,
} from "../components/features/Attrition/dashboardState";
import type { PremiumCurrencyCode } from "../components/features/Attrition/data";
import type { TrendSeriesKey } from "../components/features/Attrition/QuotePerformance/types";
import {
  activePolicyBrandOptions,
  activePolicyCountryOptions,
  activePolicyPetTypeOptions,
  downloadPaidPolicyReport,
  type PaidPolicyReportProfile,
} from "../services/activePolicyV2";
import {
  claimsBrandOptions,
  claimsCountryOptions,
  claimsPetTypeOptions,
  downloadClaimsReport,
  type ClaimsReportProfile,
} from "../services/claimsV2";
import {
  downloadFreePolicyReport,
  fetchFreePolicyFilters,
  type FreePolicyFilterOption,
  type FreePolicyOutputProfile,
} from "../services/freePolicyV2";
import {
  downloadQuoteReport,
  fetchQuoteReportColumns,
  fetchQuoteReportFilters,
  fetchQuoteReportProfiles,
  type QuoteBinaryFilterValue,
  type QuoteFilterOption,
  type QuoteReceivedSourceValue,
  type QuoteReportProfile,
  type QuoteReportSummaryItem,
} from "../services/quoteV2";
import { useAuth } from "../context/AuthContext";
import { useV2EtlDataRevision } from "../features/etl/dataRefresh";
import { useV2EtlRunner } from "../features/etl/useV2EtlRunner";
import { getUserNameParts } from "../utils/auth";
import {
  getDefaultReportingPeriod,
  getLastTwelveMonthsReportingPeriod,
} from "../utils/reportingPeriodPresets";
import style from "./page_css/Reports.module.css";

type ReportId =
  | "debtors"
  | "claims-turnaround-time"
  | "claims-data"
  | "free-policy"
  | "total-quote"
  | "converted-quotes"
  | "converted-policy"
  | "active-policy"
  | "cancelled-policy"
  | "expired-policy"
  | "pending-policy"
  | "pending-quote"
  | "lapsed-quote"
  | "converted-quote";

type ReportScope = "Policy" | "Quote" | "Account" | "Claims";

interface ReportRow {
  [key: string]: string | number;
}

interface ReportBuildContext {
  brands: string[];
  countries: string[];
  dateRange: DashboardDateRange;
  petTypes: string[];
}

interface ReportDefinition {
  columns: string[];
  description: string;
  fileStem: string;
  id: ReportId;
  icon: IconType;
  libraryDescription?: string;
  libraryLabel?: string;
  label: string;
  modalBadgeLabel?: string;
  modalTitle?: string;
  scope: ReportScope;
  buildRows: (context: ReportBuildContext) => ReportRow[];
}

interface ReportFilterModalState {
  badgeLabel: string;
  description: string;
  profile: FreePolicyOutputProfile | null;
  reportId: ReportId;
  title: string;
}

interface FreePolicyProfileOption {
  description: string;
  label: string;
  value: FreePolicyOutputProfile;
}

interface QuoteReportOption {
  description: string;
  label: string;
  reportId: QuoteReportProfile;
  rowCount?: number;
}

interface PolicyReportOption {
  description: string;
  label: string;
  reportId: ReportId;
}

interface PolicyLibraryOption {
  description: string;
  label: string;
  value: "free-policy" | "paid-policy";
}

interface FreePolicyFilterOptionsState {
  brands: FreePolicyFilterOption[];
  countries: FreePolicyFilterOption[];
  petTypes: FreePolicyFilterOption[];
}

interface QuoteFilterOptionsState {
  brands: QuoteFilterOption[];
  countries: QuoteFilterOption[];
  petTypes: QuoteFilterOption[];
}

interface StoredReportFilters {
  brands?: string[];
  countries?: string[];
  existingClient?: QuoteBinaryFilterValue;
  isFreeProduct?: QuoteBinaryFilterValue;
  isQuoteExportColumnsVisible?: boolean;
  petTypes?: string[];
  quoteExportColumns?: string[];
  quoteStatuses?: string[];
  receivedSource?: QuoteReceivedSourceValue;
  sendDocumentOnEmail?: QuoteBinaryFilterValue;
  useDefaultBrands?: boolean;
  useDefaultCountries?: boolean;
  useDefaultPetTypes?: boolean;
  useDefaultQuoteStatuses?: boolean;
}

const freePolicyProfileOptions: FreePolicyProfileOption[] = [
  {
    description:
      "All free-policy records created within the selected reporting period.",
    label: "Total Free Policies",
    value: "total-free-policies",
  },
  {
    description:
      "Free-policy records that converted to paid policy and are still active.",
    label: "Active Converted",
    value: "active-converted",
  },
  {
    description:
      "Free-policy records that converted to paid policy regardless of the current paid-policy status.",
    label: "Converted Policies",
    value: "all-converted",
  },
  {
    description:
      "Policies still active but not yet converted out of free cover.",
    label: "Active Not Converted",
    value: "active-not-converted",
  },
  {
    description:
      "Free-policy records cancelled before converting into a paid policy.",
    label: "Cancelled Not Converted",
    value: "cancelled-not-converted",
  },
  {
    description: "Policies that lapsed before converting out of free cover.",
    label: "Lapsed Not Converted",
    value: "lapsed-not-converted",
  },
];

const quoteReportOptionDefinitions: QuoteReportOption[] = [
  {
    description:
      "Quoted business that converted within the selected period, using policy created date as the reporting window.",
    label: "Converted Quote",
    reportId: "converted-quotes",
  },
  {
    description:
      "Pending quote queue with age and current stage for the selected regions.",
    label: "Pending Quote",
    reportId: "pending-quote",
  },
  {
    description:
      "Lapsed quote export grouped by the selected filters for recovery follow-up.",
    label: "Lapsed Quote",
    reportId: "lapsed-quote",
  },
  {
    description:
      "Full quote extract across the selected filters, including status and quoted premium.",
    label: "Total Quote",
    reportId: "total-quote",
  },
];

const quoteReportOptionsById = new Map<QuoteReportProfile, QuoteReportOption>(
  quoteReportOptionDefinitions.map((option) => [option.reportId, option]),
);

const buildQuoteReportOptions = (
  profiles: QuoteReportSummaryItem[],
): QuoteReportOption[] =>
  profiles.flatMap((profile) => {
    const option = quoteReportOptionsById.get(profile.profile);
    if (!option) {
      return [];
    }

    return [
      {
        ...option,
        description: profile.description || option.description,
        label: profile.label || option.label,
        rowCount: profile.count,
      },
    ];
  });

const policyLibraryOptions: PolicyLibraryOption[] = [
  {
    description:
      "Free-policy access and effective-date movement across the selected regions.",
    label: "Free Policy",
    value: "free-policy",
  },
  {
    description:
      "Sales, active, cancelled, expired, and pending policy exports grouped under paid policy.",
    label: "Paid Policy",
    value: "paid-policy",
  },
];

const isLivePaidPolicyReportProfile = (
  value: ReportId | null | undefined,
): value is PaidPolicyReportProfile =>
  value === "active-policy" ||
  value === "converted-policy" ||
  value === "cancelled-policy" ||
  value === "pending-policy" ||
  value === "expired-policy";
const isLiveClaimsReportProfile = (
  value: ReportId | null | undefined,
): value is ClaimsReportProfile =>
  value === "claims-turnaround-time" || value === "claims-data";

const paidPolicyReportOptions: PolicyReportOption[] = [
  {
    description:
      "All policies currently active across the selected markets, brands, and pet types.",
    label: "Active Policy",
    reportId: "active-policy",
  },
  {
    description:
      "Cancelled policy extract with cancellation date, reason, and premium movement.",
    label: "Cancelled Policy",
    reportId: "cancelled-policy",
  },
  {
    description:
      "Expired policies ready for review with expiry timing and annual premium values.",
    label: "Expired Policy",
    reportId: "expired-policy",
  },
  {
    description:
      "Pending policy queue with current stage, created date, and premium context.",
    label: "Pending Policy",
    reportId: "pending-policy",
  },

  {
    description:
      "Policies created within the selected period, using the live regional policy query.",
    label: "Sales",
    reportId: "converted-policy",
  },
];

const claimsReportOptions: PolicyReportOption[] = [
  {
    description:
      "Claims received in the selected period, including business days to payment or decline.",
    label: "Turnaround Time",
    reportId: "claims-turnaround-time",
  },
  {
    description:
      "Monthly claims received, under-excess, assessed, and declined trends with YoY comparisons.",
    label: "Claims Data",
    reportId: "claims-data",
  },
];

const getScopeClassName = (scope: ReportScope) => {
  switch (scope) {
    case "Policy":
      return style.reportScopePolicy;
    case "Quote":
      return style.reportScopeQuote;
    case "Account":
      return style.reportScopeAccount;
    case "Claims":
      return style.reportScopeClaims;
    default:
      return style.reportScopeQuote;
  }
};

const getAllOptionValues = <T extends string>(options: SelectionOption<T>[]) =>
  options.map((option) => option.value);

const allCountryValues = getAllOptionValues(countryFilterOptions);
const allBrandValues = getAllOptionValues(brandFilterOptions);
const allPetTypeValues = getAllOptionValues(petTypeFilterOptions);
const allActivePolicyCountryValues = getAllOptionValues(
  activePolicyCountryOptions,
);
const allActivePolicyBrandValues = getAllOptionValues(activePolicyBrandOptions);
const allActivePolicyPetTypeValues = getAllOptionValues(
  activePolicyPetTypeOptions,
);
const allClaimsCountryValues = getAllOptionValues(claimsCountryOptions);
const allClaimsBrandValues = getAllOptionValues(claimsBrandOptions);
const allClaimsPetTypeValues = getAllOptionValues(claimsPetTypeOptions);
const staticCountrySelectOptions = countryFilterOptions.map((option) => ({
  label: option.label,
  value: option.value,
}));
const staticBrandSelectOptions = brandFilterOptions.map((option) => ({
  label: option.label,
  value: option.value,
}));
const staticPetTypeSelectOptions = petTypeFilterOptions.map((option) => ({
  label: option.label,
  value: option.value,
}));
const emptyFreePolicyFilterOptions: FreePolicyFilterOptionsState = {
  brands: [],
  countries: [],
  petTypes: [],
};
const emptyQuoteFilterOptions: QuoteFilterOptionsState = {
  brands: [],
  countries: [],
  petTypes: [],
};
const defaultQuoteBinaryFilterValue: QuoteBinaryFilterValue = "all";
const quoteFreeProductPillOptions: readonly SegmentedTabOption<QuoteBinaryFilterValue>[] = [
  { key: "all", label: "All" },
  { key: "1", label: "Free Only" },
  { key: "0", label: "Paid Only" },
];
const quoteDocumentDeliveryPillOptions: readonly SegmentedTabOption<QuoteBinaryFilterValue>[] = [
  { key: "all", label: "All" },
  { key: "1", label: "Email" },
  { key: "0", label: "No Email" },
];
const quoteClientTypePillOptions: readonly SegmentedTabOption<QuoteBinaryFilterValue>[] = [
  { key: "all", label: "All" },
  { key: "1", label: "Existing" },
  { key: "0", label: "New" },
];
const quoteReceivedSourcePillOptions: readonly SegmentedTabOption<QuoteReceivedSourceValue>[] = [
  { key: "all", label: "All" },
  { key: "web", label: "Web" },
  { key: "phone", label: "Phone" },
];
const quoteStatusOptions: QuoteFilterOption[] = [
  { label: "Open", value: "Open" },
  { label: "Policy Generated", value: "Policy Generated" },
  { label: "Cancel", value: "Cancel" },
  { label: "Expired", value: "Expired" },
  { label: "Referred", value: "Referred" },
  { label: "Denied", value: "Denied" },
  { label: "Approved by Underwriter", value: "Approved by Underwriter" },
];
const allQuoteStatusValues = quoteStatusOptions.map((option) => option.value);
const REPORT_FILTER_STORAGE_KEY_PREFIX = "marketing-crm:report-filters:v2";

const buildReportFilterStorageKey = (modalState: ReportFilterModalState) => {
  const profileSegment = modalState.profile ? `:${modalState.profile}` : "";
  const schemaSegment =
    modalState.reportId === "claims-turnaround-time" ||
    modalState.reportId === "claims-data"
      ? ":claims-v2"
      : "";
  return `${REPORT_FILTER_STORAGE_KEY_PREFIX}:${modalState.reportId}${profileSegment}${schemaSegment}`;
};

const isQuoteBinaryFilterValue = (
  value: unknown,
): value is QuoteBinaryFilterValue => value === "all" || value === "1" || value === "0";

const isQuoteReceivedSourceValue = (
  value: unknown,
): value is QuoteReceivedSourceValue =>
  value === "all" || value === "web" || value === "phone";

const readStoredReportFilters = (
  storageKey: string,
): StoredReportFilters | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object"
      ? (parsed as StoredReportFilters)
      : null;
  } catch {
    return null;
  }
};

const writeStoredReportFilters = (
  storageKey: string,
  filters: StoredReportFilters,
) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(filters));
  } catch {
    // Ignore storage failures and keep the report flow working.
  }
};

const restoreStoredSelectionValues = <T extends { value: string }>(
  storedValues: string[] | undefined,
  availableOptions: T[],
  options?: {
    fallbackValues?: string[];
    preferFallback?: boolean;
    treatFullSelectionAsDefault?: boolean;
  },
) => {
  const availableValues = getFilterOptionValues(availableOptions);
  const fallbackValues = options?.fallbackValues?.length
    ? options.fallbackValues
    : availableValues;

  if (options?.preferFallback) {
    return fallbackValues;
  }

  if (!Array.isArray(storedValues)) {
    return fallbackValues;
  }

  if (!storedValues.length) {
    return [];
  }

  const availableValueSet = new Set(availableValues);
  const nextValues = Array.from(
    new Set(storedValues.filter((value) => availableValueSet.has(value))),
  );

  if (!nextValues.length) {
    return fallbackValues;
  }

  if (
    options?.treatFullSelectionAsDefault &&
    fallbackValues.length !== availableValues.length &&
    nextValues.length === availableValues.length &&
    availableValues.every((value) => nextValues.includes(value))
  ) {
    return fallbackValues;
  }

  return nextValues;
};

const getFilterOptionValues = <T extends { value: string }>(options: T[]) =>
  options.map((option) => option.value);

interface SelectAllFieldLabelProps {
  disabled?: boolean;
  label: string;
  onChange: (values: string[]) => void;
  options: Array<{ value: string }>;
  selectedValues: string[];
  showLabel?: boolean;
}

const SelectAllFieldLabel = ({
  disabled = false,
  label,
  onChange,
  options,
  selectedValues,
  showLabel = true,
}: SelectAllFieldLabelProps) => {
  const availableValues = options.map((option) => option.value);
  const selectedValueSet = new Set(selectedValues);
  const selectedCount = availableValues.filter((value) =>
    selectedValueSet.has(value),
  ).length;
  const isAllSelected =
    availableValues.length > 0 && selectedCount === availableValues.length;
  const isPartiallySelected = selectedCount > 0 && !isAllSelected;

  return (
    <div
      className={showLabel ? style.selectFieldHeader : style.selectAllOnly}
    >
      {showLabel ? <span className={style.fieldLabel}>{label}</span> : null}
      <button
        aria-label={`${isAllSelected ? "Clear" : "Select"} all ${label.toLowerCase()} options`}
        aria-pressed={isAllSelected}
        className={style.selectAllControl}
        disabled={disabled || !availableValues.length}
        onClick={() => onChange(isAllSelected ? [] : availableValues)}
        type="button"
      >
        <span
          className={`${style.selectAllBox}${
            isAllSelected || isPartiallySelected
              ? ` ${style.selectAllBoxSelected}`
              : ""
          }`}
        >
          {isAllSelected ? (
            <RiCheckLine aria-hidden="true" />
          ) : isPartiallySelected ? (
            <RiSubtractLine aria-hidden="true" />
          ) : null}
        </span>
        <span>ALL</span>
      </button>
    </div>
  );
};

const areSameValueLists = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const areSameValueSets = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }

  const rightValueSet = new Set(right);
  return left.every((value) => rightValueSet.has(value));
};

const normalizeStoredSelectionValues = <T extends { value: string }>(
  selectedValues: string[],
  availableOptions: T[],
) => {
  const availableValueSet = new Set(getFilterOptionValues(availableOptions));
  return Array.from(
    new Set(selectedValues.filter((value) => availableValueSet.has(value))),
  );
};

const serializeStoredSelectionValues = <T extends { value: string }>(
  selectedValues: string[],
  availableOptions: T[],
  options?: {
    defaultValues?: string[];
  },
) => {
  const nextValues = normalizeStoredSelectionValues(selectedValues, availableOptions);
  const defaultValues = options?.defaultValues?.length
    ? options.defaultValues
    : getFilterOptionValues(availableOptions);
  const useDefaultSelection = areSameValueSets(nextValues, defaultValues);

  return {
    useDefaultSelection,
    values: useDefaultSelection ? undefined : nextValues,
  };
};

const shouldPreferDefaultStoredSelection = (
  useDefaultSelection: boolean | undefined,
  options?: {
    assumeDefaultWhenMissing?: boolean;
  },
) =>
  useDefaultSelection === true ||
  (options?.assumeDefaultWhenMissing && useDefaultSelection !== false);

const normalizePetTypeToken = (value: string) =>
  value.replace(/[^a-z0-9]/gi, "").toUpperCase();

const getVisibleQuotePetTypeOptions = (
  profile: QuoteReportProfile | null,
  availableOptions: QuoteFilterOption[],
) => {
  if (
    profile === "pending-quote" ||
    profile === "total-quote" ||
    profile === "lapsed-quote"
  ) {
    return availableOptions.filter(
      (option) => !normalizePetTypeToken(option.value).startsWith("MIPET"),
    );
  }

  return availableOptions;
};

const getDefaultQuotePetTypeValues = (
  profile: QuoteReportProfile | null,
  availableOptions: QuoteFilterOption[],
) => {
  const visibleOptions = getVisibleQuotePetTypeOptions(profile, availableOptions);
  const availableValues = getFilterOptionValues(visibleOptions);
  if (!profile) {
    return availableValues;
  }

  const defaultValues = visibleOptions
    .map((option) => option.value)
    .filter((value) => {
      const normalizedValue = normalizePetTypeToken(value);

      if (profile === "converted-quotes") {
        return ![
          "MIPETDOG",
          "MIPETCAT",
          "COVERMYCAT",
          "COVERMYDOG",
        ].includes(normalizedValue);
      }

      return true;
    });

  return defaultValues.length ? defaultValues : availableValues;
};

const mergeOrderedSelectedValues = <T extends { value: string }>(
  currentValues: string[],
  nextValues: string[],
  availableOptions: T[],
) => {
  const nextValueSet = new Set(nextValues);
  const retainedValues = currentValues.filter((value) => nextValueSet.has(value));
  const retainedValueSet = new Set(retainedValues);
  const appendedValues = getFilterOptionValues(availableOptions).filter(
    (value) => nextValueSet.has(value) && !retainedValueSet.has(value),
  );
  const mergedValues = [...retainedValues, ...appendedValues];

  return areSameValueLists(currentValues, mergedValues)
    ? currentValues
    : mergedValues;
};

const reconcileOrderedSelectedValues = <T extends { value: string }>(
  currentValues: string[],
  availableOptions: T[],
  previousAvailableValues: string[],
  fallbackValues?: string[],
) => {
  const availableValues = getFilterOptionValues(availableOptions);
  if (!currentValues.length) {
    const nextValues =
      previousAvailableValues.length > 0
        ? currentValues
        : fallbackValues?.length
          ? fallbackValues
          : availableValues;

    return areSameValueLists(currentValues, nextValues)
      ? currentValues
      : nextValues;
  }

  const availableValueSet = new Set(availableValues);
  const retainedValues = Array.from(
    new Set(currentValues.filter((value) => availableValueSet.has(value))),
  );
  const retainedValueSet = new Set(retainedValues);
  const previousAvailableValueSet = new Set(previousAvailableValues);
  const newlyAvailableValues = availableValues.filter(
    (value) =>
      !previousAvailableValueSet.has(value) && !retainedValueSet.has(value),
  );
  const nextValues =
    retainedValues.length || newlyAvailableValues.length
      ? [...retainedValues, ...newlyAvailableValues]
      : fallbackValues?.length
        ? fallbackValues
        : availableValues;

  return areSameValueLists(currentValues, nextValues)
    ? currentValues
    : nextValues;
};

const moveSelectedValue = (
  currentValues: string[],
  draggedValue: string,
  targetValue: string | "end",
) => {
  if (!currentValues.includes(draggedValue)) {
    return currentValues;
  }

  const remainingValues = currentValues.filter((value) => value !== draggedValue);
  const nextValues = [...remainingValues];

  if (targetValue === "end") {
    nextValues.push(draggedValue);
    return areSameValueLists(currentValues, nextValues)
      ? currentValues
      : nextValues;
  }

  const targetIndex = nextValues.indexOf(targetValue);
  if (targetIndex === -1) {
    return currentValues;
  }

  nextValues.splice(targetIndex, 0, draggedValue);
  return areSameValueLists(currentValues, nextValues)
    ? currentValues
    : nextValues;
};

const pickValues = (selected: string[], fallback: SelectionOption<string>[]) =>
  selected.length
    ? selected
    : fallback.map((option) => option.label).slice(0, 3);

const csvEscape = (value: string | number) => {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

const formatCurrencyAmount = (value: number) =>
  `\u00A3${value.toLocaleString()}`;

const buildReportRows = (
  context: ReportBuildContext,
  columns: string[],
  rowFactory: (
    index: number,
    values: {
      brand: string;
      country: string;
      date: string;
      petType: string;
    },
  ) => ReportRow,
) => {
  const countries = pickValues(context.countries, countryFilterOptions);
  const brands = pickValues(context.brands, brandFilterOptions);
  const petTypes = pickValues(context.petTypes, petTypeFilterOptions);
  const [, endDate] = context.dateRange;
  const baseDate = endDate ? dayjs(endDate) : dayjs();
  const rowCount = Math.max(
    countries.length,
    brands.length,
    petTypes.length,
    4,
  );

  return Array.from({ length: rowCount }, (_, index) => {
    const row = rowFactory(index, {
      brand: brands[index % brands.length] ?? "All Brands",
      country: countries[index % countries.length] ?? "All Countries",
      date: baseDate.subtract(index * 2, "day").format("DD MMM YYYY"),
      petType: petTypes[index % petTypes.length] ?? "All Pet Types",
    });

    return columns.reduce<ReportRow>((accumulator, column) => {
      accumulator[column] = row[column] ?? "";
      return accumulator;
    }, {});
  });
};

const reportDefinitions: ReportDefinition[] = [
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Effective Date",
      "Free Days",
      "Status",
    ],
    description:
      "Free-policy access and effective-date movement across the selected regions.",
    fileStem: "free_policy",
    icon: RiShieldCheckLine,
    id: "free-policy",
    label: "Free Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Effective Date",
          "Free Days",
          "Status",
        ],
        (index, values) => ({
          Brand: values.brand,
          Country: values.country,
          "Effective Date": values.date,
          "Free Days": 14 + index,
          "Pet Type": values.petType,
          "Policy Number": `FP-${1000 + index}`,
          Status:
            index % 4 === 0
              ? "Active Converted"
              : index % 4 === 1
                ? "Active Not Converted"
                : index % 4 === 2
                  ? "Cancelled Not Converted"
                  : "Lapsed Not Converted",
        }),
      ),
  },
  {
    columns: [
      "Account Reference",
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Invoice Date",
      "Outstanding Amount",
      "Age Bucket",
      "Collection Status",
    ],
    description:
      "Outstanding debtor balances by market, brand, and aging bucket for finance follow-up.",
    fileStem: "debtors_report",
    icon: RiFileTextLine,
    id: "debtors",
    libraryDescription:
      "Account-level debtor balances and collection status for finance follow-up.",
    libraryLabel: "Account Reports",
    label: "Debtors",
    modalBadgeLabel: "Result",
    modalTitle: "Debtors",
    scope: "Account",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Account Reference",
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Invoice Date",
          "Outstanding Amount",
          "Age Bucket",
          "Collection Status",
        ],
        (index, values) => ({
          "Account Reference": `DBT-${8400 + index}`,
          "Age Bucket":
            index % 4 === 0
              ? "0-30 Days"
              : index % 4 === 1
                ? "31-60 Days"
                : index % 4 === 2
                  ? "61-90 Days"
                  : "90+ Days",
          Brand: values.brand,
          "Collection Status":
            index % 3 === 0
              ? "Reminder sent"
              : index % 3 === 1
                ? "Payment plan"
                : "Escalated",
          Country: values.country,
          "Invoice Date": values.date,
          "Outstanding Amount": formatCurrencyAmount(95 + index * 37),
          "Pet Type": values.petType,
          "Policy Number": `DP-${5200 + index}`,
        }),
      ),
  },
  {
    columns: [
      "Claim Number",
      "Country",
      "Brand",
      "Pet Type",
      "Claim Received Date",
      "Claim Closed Date",
      "Turnaround Time (Days)",
      "Claim Status",
    ],
    description:
      "Claims received in the selected period, including business days to payment or decline.",
    fileStem: "claims_turnaround_time",
    icon: RiFileTextLine,
    id: "claims-turnaround-time",
    label: "Turnaround Time",
    scope: "Claims",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Claim Number",
          "Country",
          "Brand",
          "Pet Type",
          "Claim Received Date",
          "Claim Closed Date",
          "Turnaround Time (Days)",
          "Claim Status",
        ],
        (index, values) => {
          const turnaroundDays = 2 + (index % 12);
          return {
            Brand: values.brand,
            "Claim Closed Date": dayjs(values.date)
              .add(turnaroundDays, "day")
              .format("YYYY-MM-DD"),
            "Claim Number": `CL-${9200 + index}`,
            "Claim Received Date": values.date,
            "Claim Status": "Closed",
            Country: values.country,
            "Pet Type": values.petType,
            "Turnaround Time (Days)": turnaroundDays,
          };
        },
      ),
  },
  {
    columns: [
      "Month",
      "Total Claims Received",
      "Under Excess",
      "Claims Assessed",
      "Claims Assessed YoY",
      "Declined",
      "Declined Percentage",
      "Declined YoY",
    ],
    description:
      "Monthly claims received, under-excess, assessed, and declined trends with YoY comparisons.",
    fileStem: "claims_data",
    icon: RiFileTextLine,
    id: "claims-data",
    label: "Claims Data",
    scope: "Claims",
    buildRows: () => [],
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Cancellation Date",
      "Cancellation Reason",
      "Refund Value",
    ],
    description:
      "Cancelled policy extract with cancellation date, reason, and premium movement.",
    fileStem: "cancelled_policy",
    icon: RiShieldCheckLine,
    id: "cancelled-policy",
    label: "Cancelled Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Cancellation Date",
          "Cancellation Reason",
          "Refund Value",
        ],
        (index, values) => ({
          Brand: values.brand,
          "Cancellation Date": values.date,
          "Cancellation Reason":
            index % 3 === 0
              ? "Customer request"
              : index % 3 === 1
                ? "Non-payment"
                : "Coverage change",
          Country: values.country,
          "Pet Type": values.petType,
          "Policy Number": `XP-${4300 + index}`,
          "Refund Value": formatCurrencyAmount(110 + index * 28),
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Expiry Date",
      "Last Active Date",
      "Annual Premium",
    ],
    description:
      "Expired policies ready for review with expiry timing and annual premium values.",
    fileStem: "expired_policy",
    icon: RiShieldCheckLine,
    id: "expired-policy",
    label: "Expired Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Expiry Date",
          "Last Active Date",
          "Annual Premium",
        ],
        (index, values) => ({
          "Annual Premium": formatCurrencyAmount(470 + index * 34),
          Brand: values.brand,
          Country: values.country,
          "Expiry Date": values.date,
          "Last Active Date": dayjs(values.date, "DD MMM YYYY")
            .subtract(12 + index, "month")
            .format("DD MMM YYYY"),
          "Pet Type": values.petType,
          "Policy Number": `EP-${4500 + index}`,
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Created Date",
      "Pending Stage",
      "Quoted Premium",
    ],
    description:
      "Pending policy queue with current stage, created date, and premium context.",
    fileStem: "pending_policy",
    icon: RiShieldCheckLine,
    id: "pending-policy",
    label: "Pending Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Created Date",
          "Pending Stage",
          "Quoted Premium",
        ],
        (index, values) => ({
          Brand: values.brand,
          "Created Date": values.date,
          Country: values.country,
          "Pending Stage":
            index % 3 === 0
              ? "Awaiting documents"
              : index % 3 === 1
                ? "Payment review"
                : "Compliance check",
          "Pet Type": values.petType,
          "Policy Number": `PP-${4700 + index}`,
          "Quoted Premium": formatCurrencyAmount(390 + index * 22),
        }),
      ),
  },

  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Converted Date",
      "Premium",
      "Channel",
    ],
    description:
      "Quoted business that converted within the selected period, using policy created date as the reporting window.",
    fileStem: "converted_quotes",
    icon: RiLineChartLine,
    id: "converted-quotes",
    label: "Converted Quote",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Converted Date",
          "Premium",
          "Channel",
        ],
        (index, values) => ({
          Brand: values.brand,
          Channel: index % 2 === 0 ? "Web" : "Contact Center",
          "Converted Date": values.date,
          Country: values.country,
          "Pet Type": values.petType,
          Premium: formatCurrencyAmount(245 + index * 18),
          "Quote Reference": `CQ-${2400 + index}`,
        }),
      ),
  },
  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Created Date",
      "Quote Status",
      "Quoted Premium",
    ],
    description:
      "Full quote extract across the selected filters, including status and quoted premium.",
    fileStem: "total_quote",
    icon: RiLineChartLine,
    id: "total-quote",
    label: "Total Quote",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Created Date",
          "Quote Status",
          "Quoted Premium",
        ],
        (index, values) => ({
          Brand: values.brand,
          Country: values.country,
          "Created Date": values.date,
          "Pet Type": values.petType,
          "Quote Reference": `TQ-${4400 + index}`,
          "Quote Status":
            index % 4 === 0
              ? "Converted"
              : index % 4 === 1
                ? "Pending"
                : index % 4 === 2
                  ? "Lapsed"
                  : "Quoted",
          "Quoted Premium": formatCurrencyAmount(180 + index * 16),
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Sale Date",
      "Policy Status",
      "Annual Premium",
    ],
    description:
      "Policies created within the selected reporting period with policy status 1.",
    fileStem: "sales_policy",
    icon: RiShieldCheckLine,
    id: "converted-policy",
    label: "Sales",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Sale Date",
          "Policy Status",
          "Annual Premium",
        ],
        (index, values) => ({
          "Sale Date": values.date,
          "Annual Premium": formatCurrencyAmount(510 + index * 45),
          Brand: values.brand,
          Country: values.country,
          "Pet Type": values.petType,
          "Policy Number": `CP-${3200 + index}`,
          "Policy Status": "Active",
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Active Since",
      "Renewal Due",
      "Annual Premium",
    ],
    description:
      "All policies currently active across the selected markets, brands, and pet types.",
    fileStem: "active_policy",
    icon: RiShieldCheckLine,
    id: "active-policy",
    label: "Active Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Active Since",
          "Renewal Due",
          "Annual Premium",
        ],
        (index, values) => ({
          "Active Since": dayjs(values.date, "DD MMM YYYY")
            .subtract(4 + index, "month")
            .format("DD MMM YYYY"),
          "Annual Premium": formatCurrencyAmount(620 + index * 31),
          Brand: values.brand,
          Country: values.country,
          "Pet Type": values.petType,
          "Policy Number": `AP-${4100 + index}`,
          "Renewal Due": dayjs(values.date, "DD MMM YYYY")
            .add(11 - index, "month")
            .format("DD MMM YYYY"),
        }),
      ),
  },
  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Created Date",
      "Age Days",
      "Stage",
    ],
    description:
      "Pending quote queue with age and current stage for the selected regions.",
    fileStem: "pending_quote",
    icon: RiLineChartLine,
    id: "pending-quote",
    label: "Pending Quote",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Created Date",
          "Age Days",
          "Stage",
        ],
        (index, values) => ({
          "Age Days": 3 + index * 2,
          Brand: values.brand,
          "Created Date": values.date,
          Country: values.country,
          "Pet Type": values.petType,
          "Quote Reference": `PQ-${5100 + index}`,
          Stage: index % 2 === 0 ? "Awaiting follow-up" : "Price review",
        }),
      ),
  },
  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Lapsed Date",
      "Age Bucket",
      "Reason",
    ],
    description:
      "Lapsed quote export grouped by the selected filters for recovery follow-up.",
    fileStem: "lapsed_quote",
    icon: RiLineChartLine,
    id: "lapsed-quote",
    label: "Lapsed Quote",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Lapsed Date",
          "Age Bucket",
          "Reason",
        ],
        (index, values) => ({
          "Age Bucket":
            index % 3 === 0
              ? "0-30 Days"
              : index % 3 === 1
                ? "31-60 Days"
                : "61-90 Days",
          Brand: values.brand,
          Country: values.country,
          "Lapsed Date": values.date,
          "Pet Type": values.petType,
          "Quote Reference": `LQ-${6100 + index}`,
          Reason: index % 2 === 0 ? "No response" : "Price sensitivity",
        }),
      ),
  },
  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Converted Date",
      "Converted By",
      "Sales Value",
    ],
    description:
      "Converted-quote detail focused on ownership and sales value for follow-up.",
    fileStem: "converted_quote_detail",
    icon: RiLineChartLine,
    id: "converted-quote",
    label: "Converted Quote",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Converted Date",
          "Converted By",
          "Sales Value",
        ],
        (index, values) => ({
          Brand: values.brand,
          Country: values.country,
          "Converted By":
            index % 2 === 0 ? "Contact Center Agent" : "Web Journey",
          "Converted Date": values.date,
          "Pet Type": values.petType,
          "Quote Reference": `CD-${7100 + index}`,
          "Sales Value": formatCurrencyAmount(210 + index * 24),
        }),
      ),
  },
];

interface SelectionPalette {
  activeOptionBackground: string;
  inputBorder: string;
  pillBackground: string;
  pillBorder: string;
  pillText: string;
  sectionColor: string;
}

const createSelectionInputStyles = (palette: SelectionPalette) =>
  ({
    dropdown: {
      backdropFilter: "blur(20px)",
      background:
        "linear-gradient(180deg, rgba(43, 46, 60, 0.98), rgba(35, 38, 51, 0.98))",
      border: "1px solid rgba(255, 255, 255, 0.08)",
    },
    input: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      border: `1px solid ${palette.inputBorder}`,
      borderRadius: "1rem",
      color: "var(--text-h)",
      fontSize: "0.92rem",
      fontWeight: 600,
      minHeight: "3.15rem",
    },
    label: {
      display: "none",
    },
    option: {
      borderRadius: 0,
      color: "var(--text-h)",
      fontSize: "0.88rem",
      minHeight: "2.25rem",
      "&[data-checked]": {
        backgroundColor: palette.activeOptionBackground,
        color: "#f6f2ff",
      },
    },
    pill: {
      "--pill-radius": "0.55rem",
      backgroundColor: palette.pillBackground,
      border: `1px solid ${palette.pillBorder}`,
      borderRadius: "0.55rem",
      color: palette.pillText,
      fontWeight: 700,
      minHeight: "1.55rem",
    },
    section: {
      color: palette.sectionColor,
    },
  }) as const;

const countrySelectionInputStyles = createSelectionInputStyles({
  activeOptionBackground: "rgba(104, 113, 176, 0.22)",
  inputBorder: "rgba(108, 117, 186, 0.22)",
  pillBackground: "rgba(102, 112, 176, 0.16)",
  pillBorder: "rgba(144, 155, 226, 0.24)",
  pillText: "#e8ebff",
  sectionColor: "rgba(190, 198, 255, 0.72)",
});

const brandSelectionInputStyles = createSelectionInputStyles({
  activeOptionBackground: "rgba(86, 150, 124, 0.22)",
  inputBorder: "rgba(95, 158, 132, 0.22)",
  pillBackground: "rgba(82, 146, 120, 0.16)",
  pillBorder: "rgba(121, 194, 164, 0.24)",
  pillText: "#e1f7ec",
  sectionColor: "rgba(178, 231, 204, 0.7)",
});

const petTypeSelectionInputStyles = createSelectionInputStyles({
  activeOptionBackground: "rgba(157, 116, 88, 0.22)",
  inputBorder: "rgba(167, 126, 97, 0.22)",
  pillBackground: "rgba(154, 114, 86, 0.16)",
  pillBorder: "rgba(208, 163, 126, 0.24)",
  pillText: "#ffeadb",
  sectionColor: "rgba(235, 199, 170, 0.72)",
});
const quoteFlagSelectionInputStyles = createSelectionInputStyles({
  activeOptionBackground: "rgba(143, 108, 173, 0.24)",
  inputBorder: "rgba(154, 120, 184, 0.22)",
  pillBackground: "rgba(149, 114, 181, 0.16)",
  pillBorder: "rgba(204, 176, 232, 0.24)",
  pillText: "#f3e8ff",
  sectionColor: "rgba(222, 205, 242, 0.74)",
});


const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, logout, user } = useAuth();
  const [isFreePolicyTypeModalOpen, setIsFreePolicyTypeModalOpen] =
    useState(false);
  const [isPolicyTypeModalOpen, setIsPolicyTypeModalOpen] = useState(false);
  const [isPaidPolicyTypeModalOpen, setIsPaidPolicyTypeModalOpen] =
    useState(false);
  const [isActivePolicyConfirmationOpen, setIsActivePolicyConfirmationOpen] =
    useState(false);
  const [isQuoteTypeModalOpen, setIsQuoteTypeModalOpen] = useState(false);
  const [isClaimsTypeModalOpen, setIsClaimsTypeModalOpen] = useState(false);
  const etlRunner = useV2EtlRunner();
  const freePolicyEtlDataRevision = useV2EtlDataRevision("free-policy");
  const quoteEtlDataRevision = useV2EtlDataRevision("quote");
  const [activeFilterModal, setActiveFilterModal] =
    useState<ReportFilterModalState | null>(null);
  const [reportingPeriod, setReportingPeriod] =
    useState<DashboardDateRange>(getDefaultReportingPeriod);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    ...allCountryValues,
  ]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([
    ...allBrandValues,
  ]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([
    ...allPetTypeValues,
  ]);
  const [selectedIsFreeProduct, setSelectedIsFreeProduct] =
    useState<QuoteBinaryFilterValue>(defaultQuoteBinaryFilterValue);
  const [selectedSendDocumentOnEmail, setSelectedSendDocumentOnEmail] =
    useState<QuoteBinaryFilterValue>(defaultQuoteBinaryFilterValue);
  const [selectedExistingClient, setSelectedExistingClient] =
    useState<QuoteBinaryFilterValue>(defaultQuoteBinaryFilterValue);
  const [selectedQuoteStatuses, setSelectedQuoteStatuses] = useState<string[]>([
    ...allQuoteStatusValues,
  ]);
  const [selectedReceivedSource, setSelectedReceivedSource] =
    useState<QuoteReceivedSourceValue>("all");
  const [isQuoteExportColumnsVisible, setIsQuoteExportColumnsVisible] =
    useState(false);
  const [isFilterStateReady, setIsFilterStateReady] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isDownloadInProgress, setIsDownloadInProgress] = useState(false);
  const [freePolicyFilterOptions, setFreePolicyFilterOptions] =
    useState<FreePolicyFilterOptionsState>(emptyFreePolicyFilterOptions);
  const [isFreePolicyFilterBootstrapLoading, setIsFreePolicyFilterBootstrapLoading] =
    useState(false);
  const [isFreePolicyBrandOptionsLoading, setIsFreePolicyBrandOptionsLoading] =
    useState(false);
  const [isFreePolicyPetTypeOptionsLoading, setIsFreePolicyPetTypeOptionsLoading] =
    useState(false);
  const [freePolicyFiltersError, setFreePolicyFiltersError] = useState<
    string | null
  >(null);
  const freePolicyBrandRequestRef = useRef<AbortController | null>(null);
  const freePolicyPetTypeRequestRef = useRef<AbortController | null>(null);
  const [quoteFilterOptions, setQuoteFilterOptions] =
    useState<QuoteFilterOptionsState>(emptyQuoteFilterOptions);
  const [availableQuoteExportColumns, setAvailableQuoteExportColumns] =
    useState<QuoteFilterOption[]>([]);
  const [selectedQuoteExportColumns, setSelectedQuoteExportColumns] =
    useState<string[]>([]);
  const [draggedQuoteExportColumn, setDraggedQuoteExportColumn] = useState<
    string | null
  >(null);
  const [quoteExportDropTarget, setQuoteExportDropTarget] = useState<
    string | "end" | null
  >(null);
  const [isQuoteFilterBootstrapLoading, setIsQuoteFilterBootstrapLoading] =
    useState(false);
  const [isQuoteBrandOptionsLoading, setIsQuoteBrandOptionsLoading] =
    useState(false);
  const [isQuotePetTypeOptionsLoading, setIsQuotePetTypeOptionsLoading] =
    useState(false);
  const [isQuoteExportColumnsLoading, setIsQuoteExportColumnsLoading] =
    useState(false);
  const [availableQuoteReportOptions, setAvailableQuoteReportOptions] =
    useState<QuoteReportOption[]>(quoteReportOptionDefinitions);
  const [isQuoteReportOptionsLoading, setIsQuoteReportOptionsLoading] =
    useState(false);
  const [quoteReportOptionsError, setQuoteReportOptionsError] = useState<
    string | null
  >(null);
  const [quoteFiltersError, setQuoteFiltersError] = useState<string | null>(
    null,
  );
  const quoteBrandRequestRef = useRef<AbortController | null>(null);
  const quotePetTypeRequestRef = useRef<AbortController | null>(null);
  const previousQuoteExportColumnsRef = useRef<string[]>([]);
  const hasCustomizedQuoteExportColumnsRef = useRef(false);
  const hasQuoteFilterBootstrapCompletedRef = useRef(false);
  const savedReportFiltersRef = useRef<StoredReportFilters | null>(null);

  const activeReport = useMemo(
    () =>
      activeFilterModal
        ? (reportDefinitions.find(
            (report) => report.id === activeFilterModal.reportId,
          ) ?? null)
        : null,
    [activeFilterModal],
  );
  const isFreePolicyReportActive =
    activeReport?.id === "free-policy" && Boolean(activeFilterModal?.profile);
  const paidPolicyReportProfile = isLivePaidPolicyReportProfile(activeReport?.id)
    ? activeReport.id
    : null;
  const isLivePaidPolicyReportActive = paidPolicyReportProfile !== null;
  const claimsReportProfile = isLiveClaimsReportProfile(activeReport?.id)
    ? activeReport.id
    : null;
  const isLiveClaimsReportActive = claimsReportProfile !== null;
  const isLiveSourceReportActive =
    isLivePaidPolicyReportActive || isLiveClaimsReportActive;
  const isActivePolicyReportActive =
    paidPolicyReportProfile === "active-policy";

  const isQuoteReportActive = Boolean(
    activeReport &&
      quoteReportOptionDefinitions.some(
        (option) => option.reportId === activeReport.id,
      ),
  );
  const activeQuoteProfile = isQuoteReportActive
    ? (activeReport?.id as QuoteReportProfile)
    : null;
  const activeReportStorageKey = useMemo(
    () =>
      activeFilterModal ? buildReportFilterStorageKey(activeFilterModal) : null,
    [activeFilterModal],
  );
  const standaloneLibraryReports = useMemo(
    () =>
      reportDefinitions.filter((report) => report.id === "debtors"),
    [],
  );
  const countryOptionsData = isLiveClaimsReportActive
    ? claimsCountryOptions
    : isLivePaidPolicyReportActive
      ? activePolicyCountryOptions
    : isFreePolicyReportActive
      ? freePolicyFilterOptions.countries
      : isQuoteReportActive
        ? quoteFilterOptions.countries
        : staticCountrySelectOptions;
  const brandOptionsData = isLiveClaimsReportActive
    ? claimsBrandOptions
    : isLivePaidPolicyReportActive
      ? activePolicyBrandOptions
    : isFreePolicyReportActive
      ? freePolicyFilterOptions.brands
      : isQuoteReportActive
        ? quoteFilterOptions.brands
        : staticBrandSelectOptions;
  const petTypeOptionsData = isLiveClaimsReportActive
    ? claimsPetTypeOptions
    : isLivePaidPolicyReportActive
      ? activePolicyPetTypeOptions
    : isFreePolicyReportActive
      ? freePolicyFilterOptions.petTypes
      : isQuoteReportActive
        ? quoteFilterOptions.petTypes
        : staticPetTypeSelectOptions;
  const isFreePolicyFiltersBusy =
    isFreePolicyFilterBootstrapLoading ||
    isFreePolicyBrandOptionsLoading ||
    isFreePolicyPetTypeOptionsLoading;
  const isQuoteFiltersBusy =
    isQuoteFilterBootstrapLoading ||
    isQuoteBrandOptionsLoading ||
    isQuotePetTypeOptionsLoading;
  const isCountrySelectionDisabled =
    (isFreePolicyReportActive &&
      (isFreePolicyFilterBootstrapLoading || !countryOptionsData.length)) ||
    (isQuoteReportActive &&
      (isQuoteFilterBootstrapLoading || !countryOptionsData.length));
  const isBrandSelectionDisabled =
    (isFreePolicyReportActive &&
      (isFreePolicyFilterBootstrapLoading ||
        isFreePolicyBrandOptionsLoading ||
        !selectedCountries.length ||
        !brandOptionsData.length)) ||
    (isQuoteReportActive &&
      (isQuoteFilterBootstrapLoading ||
        isQuoteBrandOptionsLoading ||
        !selectedCountries.length ||
        !brandOptionsData.length));
  const isPetTypeSelectionDisabled =
    (isFreePolicyReportActive &&
      (isFreePolicyFilterBootstrapLoading ||
        isFreePolicyPetTypeOptionsLoading ||
        !selectedBrands.length ||
        !petTypeOptionsData.length)) ||
    (isQuoteReportActive &&
      (isQuoteFilterBootstrapLoading ||
        isQuotePetTypeOptionsLoading ||
        !selectedBrands.length ||
        !petTypeOptionsData.length));
  const isQuoteExportColumnSelectionDisabled =
    isQuoteExportColumnsLoading || !availableQuoteExportColumns.length;

  const canDownload = Boolean(
    activeReport &&
    isFilterStateReady &&
    (isActivePolicyReportActive ||
      (reportingPeriod[0] && reportingPeriod[1])) &&
    selectedCountries.length &&
    selectedBrands.length &&
    selectedPetTypes.length &&
    (!isFreePolicyReportActive ||
      (!isFreePolicyFiltersBusy &&
        !freePolicyFiltersError &&
        countryOptionsData.length &&
        brandOptionsData.length &&
        petTypeOptionsData.length)) &&
    (!isQuoteReportActive ||
      (!isQuoteFiltersBusy &&
        !quoteFiltersError &&
        countryOptionsData.length &&
        brandOptionsData.length &&
        petTypeOptionsData.length &&
        selectedQuoteStatuses.length &&
        !isQuoteExportColumnsLoading &&
        availableQuoteExportColumns.length &&
        selectedQuoteExportColumns.length)),
  );
  const liveRegionOptions = isLiveClaimsReportActive
    ? claimsCountryOptions
    : activePolicyCountryOptions;
  const selectedLiveReportRegions = liveRegionOptions.filter((option) =>
    selectedCountries.includes(option.value),
  );
  const paidPolicySnapshotScope =
    paidPolicyReportProfile === "converted-policy"
      ? "Sales policies created in the selected reporting period"
      : paidPolicyReportProfile === "cancelled-policy"
      ? "Policies cancelled in the selected reporting period"
      : paidPolicyReportProfile === "pending-policy"
      ? "All pending policies"
      : paidPolicyReportProfile === "expired-policy"
        ? "All expired policies"
        : "All currently active policies";
  const liveReportSnapshotScope =
    claimsReportProfile === "claims-data"
      ? "Monthly claims plus prior-year comparison source data"
      : isLiveClaimsReportActive
        ? "Claims created in the selected reporting period"
        : paidPolicySnapshotScope;
  const reportModalTitle = activeFilterModal?.title ?? "Report";
  const quoteExportColumnLabelMap = useMemo(
    () =>
      new Map(
        availableQuoteExportColumns.map((option) => [option.value, option.label]),
      ),
    [availableQuoteExportColumns],
  );
  const quoteExportSummaryText = useMemo(() => {
    if (isQuoteExportColumnsLoading && !availableQuoteExportColumns.length) {
      return "Loading export columns...";
    }

    if (!availableQuoteExportColumns.length) {
      return "All export columns will be selected by default once the list loads.";
    }

    return `${selectedQuoteExportColumns.length} ${
      selectedQuoteExportColumns.length === 1 ? "column" : "columns"
    } selected for export.`;
  }, [
    availableQuoteExportColumns.length,
    isQuoteExportColumnsLoading,
    selectedQuoteExportColumns.length,
  ]);
  const { firstName, lastName } = getUserNameParts(user);

  const resetFilters = () => {
    setReportingPeriod(getDefaultReportingPeriod());
    setSelectedCountries([...allCountryValues]);
    setSelectedBrands([...allBrandValues]);
    setSelectedPetTypes([...allPetTypeValues]);
    setSelectedIsFreeProduct(defaultQuoteBinaryFilterValue);
    setSelectedSendDocumentOnEmail(defaultQuoteBinaryFilterValue);
    setSelectedExistingClient(defaultQuoteBinaryFilterValue);
    setSelectedQuoteStatuses([...allQuoteStatusValues]);
    setSelectedReceivedSource("all");
    setIsQuoteExportColumnsVisible(false);
    setIsFilterStateReady(false);
    setAvailableQuoteExportColumns([]);
    setSelectedQuoteExportColumns([]);
    setDraggedQuoteExportColumn(null);
    setQuoteExportDropTarget(null);
    previousQuoteExportColumnsRef.current = [];
    hasCustomizedQuoteExportColumnsRef.current = false;
    hasQuoteFilterBootstrapCompletedRef.current = false;
    savedReportFiltersRef.current = null;
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
    setQuoteReportOptionsError(null);
    setQuoteFiltersError(null);
    setIsFreePolicyBrandOptionsLoading(false);
    setIsFreePolicyPetTypeOptionsLoading(false);
    setIsQuoteBrandOptionsLoading(false);
    setIsQuotePetTypeOptionsLoading(false);
    setIsQuoteExportColumnsLoading(false);
  };

  const stopFreePolicyRequests = () => {
    freePolicyBrandRequestRef.current?.abort();
    freePolicyPetTypeRequestRef.current?.abort();
    setIsFreePolicyFilterBootstrapLoading(false);
    setIsFreePolicyBrandOptionsLoading(false);
    setIsFreePolicyPetTypeOptionsLoading(false);
  };

  const stopQuoteRequests = () => {
    quoteBrandRequestRef.current?.abort();
    quotePetTypeRequestRef.current?.abort();
    setIsQuoteFilterBootstrapLoading(false);
    setIsQuoteBrandOptionsLoading(false);
    setIsQuotePetTypeOptionsLoading(false);
    setIsQuoteExportColumnsLoading(false);
  };

  const closePolicyLibraryModal = () => {
    setIsPolicyTypeModalOpen(false);
    setIsPaidPolicyTypeModalOpen(false);
    setIsFreePolicyTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
    setQuoteReportOptionsError(null);
    setQuoteFiltersError(null);
  };

  const closePaidPolicyTypeModal = () => {
    setIsPaidPolicyTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
    setQuoteReportOptionsError(null);
    setQuoteFiltersError(null);
  };

  const closeFreePolicyTypeModal = () => {
    stopFreePolicyRequests();
    setIsFreePolicyTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
    setQuoteReportOptionsError(null);
    setQuoteFiltersError(null);
  };

  const closeQuoteTypeModal = () => {
    stopQuoteRequests();
    setIsQuoteTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
    setQuoteReportOptionsError(null);
    setQuoteFiltersError(null);
  };


  const closeClaimsTypeModal = () => {
    setIsClaimsTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
  };

  const closeFilterModal = () => {
    stopFreePolicyRequests();
    stopQuoteRequests();
    setActiveFilterModal(null);
    setIsActivePolicyConfirmationOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
    setQuoteReportOptionsError(null);
    setQuoteFiltersError(null);
  };

  const closeActivePolicyConfirmation = () => {
    setIsActivePolicyConfirmationOpen(false);
  };

  const closeTopmostModal = () => {
    if (isActivePolicyConfirmationOpen) {
      closeActivePolicyConfirmation();
      return;
    }

    if (activeFilterModal) {
      closeFilterModal();
      return;
    }

    if (isFreePolicyTypeModalOpen) {
      closeFreePolicyTypeModal();
      return;
    }

    if (isPaidPolicyTypeModalOpen) {
      closePaidPolicyTypeModal();
      return;
    }


    if (isClaimsTypeModalOpen) {
      closeClaimsTypeModal();
      return;
    }

    if (isPolicyTypeModalOpen) {
      closePolicyLibraryModal();
      return;
    }

    if (isQuoteTypeModalOpen) {
      closeQuoteTypeModal();
      return;
    }
  };

  useEffect(() => {
    if (
      !isFreePolicyTypeModalOpen &&
      !isPaidPolicyTypeModalOpen &&
      !isClaimsTypeModalOpen &&
      !isPolicyTypeModalOpen &&
      !isQuoteTypeModalOpen &&
      !isActivePolicyConfirmationOpen &&
      !activeFilterModal
    ) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTopmostModal();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeFilterModal,
    isActivePolicyConfirmationOpen,
    isClaimsTypeModalOpen,
    isFreePolicyTypeModalOpen,
    isPaidPolicyTypeModalOpen,
    isPolicyTypeModalOpen,
    isQuoteTypeModalOpen,
  ]);

  useEffect(() => {
    if (!activeFilterModal || !activeReportStorageKey) {
      savedReportFiltersRef.current = null;
      setIsFilterStateReady(false);
      return;
    }

    const savedFilters = readStoredReportFilters(activeReportStorageKey);
    const savedQuoteExportColumns = Array.isArray(savedFilters?.quoteExportColumns)
      ? Array.from(
          new Set(
            savedFilters.quoteExportColumns.filter(
              (value): value is string => typeof value === "string" && value.length > 0,
            ),
          ),
        )
      : [];

    savedReportFiltersRef.current = savedFilters;
    hasCustomizedQuoteExportColumnsRef.current = savedQuoteExportColumns.length > 0;
    hasQuoteFilterBootstrapCompletedRef.current = false;
    previousQuoteExportColumnsRef.current = [];
    setIsFilterStateReady(false);
    setSelectedIsFreeProduct(
      isQuoteBinaryFilterValue(savedFilters?.isFreeProduct)
        ? savedFilters.isFreeProduct
        : defaultQuoteBinaryFilterValue,
    );
    setSelectedSendDocumentOnEmail(
      isQuoteBinaryFilterValue(savedFilters?.sendDocumentOnEmail)
        ? savedFilters.sendDocumentOnEmail
        : defaultQuoteBinaryFilterValue,
    );
    setSelectedExistingClient(
      isQuoteBinaryFilterValue(savedFilters?.existingClient)
        ? savedFilters.existingClient
        : defaultQuoteBinaryFilterValue,
    );
    setSelectedQuoteStatuses(
      restoreStoredSelectionValues(savedFilters?.quoteStatuses, quoteStatusOptions, {
        preferFallback: shouldPreferDefaultStoredSelection(
          savedFilters?.useDefaultQuoteStatuses,
          {
            assumeDefaultWhenMissing: activeQuoteProfile === "total-quote",
          },
        ),
      }),
    );
    setSelectedReceivedSource(
      isQuoteReceivedSourceValue(savedFilters?.receivedSource)
        ? savedFilters.receivedSource
        : "all",
    );
    setIsQuoteExportColumnsVisible(Boolean(savedFilters?.isQuoteExportColumnsVisible));
    setSelectedQuoteExportColumns(savedQuoteExportColumns);

    if (!isFreePolicyReportActive && !isQuoteReportActive) {
      const availableCountries = isLiveClaimsReportActive
        ? claimsCountryOptions
        : isLivePaidPolicyReportActive
          ? activePolicyCountryOptions
          : staticCountrySelectOptions;
      const availableBrands = isLiveClaimsReportActive
        ? claimsBrandOptions
        : isLivePaidPolicyReportActive
          ? activePolicyBrandOptions
          : staticBrandSelectOptions;
      const availablePetTypes = isLiveClaimsReportActive
        ? claimsPetTypeOptions
        : isLivePaidPolicyReportActive
          ? activePolicyPetTypeOptions
          : staticPetTypeSelectOptions;
      setSelectedCountries(
        restoreStoredSelectionValues(savedFilters?.countries, availableCountries),
      );
      setSelectedBrands(
        restoreStoredSelectionValues(savedFilters?.brands, availableBrands),
      );
      setSelectedPetTypes(
        restoreStoredSelectionValues(savedFilters?.petTypes, availablePetTypes),
      );
      setIsFilterStateReady(true);
    }
  }, [
    activeFilterModal,
    activeQuoteProfile,
    activeReportStorageKey,
    isLiveClaimsReportActive,
    isLivePaidPolicyReportActive,
    isFreePolicyReportActive,
    isQuoteReportActive,
  ]);

  useEffect(() => {
    if (!isFreePolicyReportActive) {
      freePolicyBrandRequestRef.current?.abort();
      freePolicyPetTypeRequestRef.current?.abort();
      setFreePolicyFilterOptions(emptyFreePolicyFilterOptions);
      setIsFreePolicyFilterBootstrapLoading(false);
      setIsFreePolicyBrandOptionsLoading(false);
      setIsFreePolicyPetTypeOptionsLoading(false);
      setFreePolicyFiltersError(null);
      return;
    }

    freePolicyBrandRequestRef.current?.abort();
    freePolicyPetTypeRequestRef.current?.abort();

    const [startDate, endDate] = reportingPeriod;
    const freePolicyProfile = activeFilterModal?.profile;
    if (!freePolicyProfile || !startDate || !endDate) {
      setFreePolicyFilterOptions(emptyFreePolicyFilterOptions);
      setIsFreePolicyFilterBootstrapLoading(false);
      setIsFilterStateReady(true);
      return;
    }

    const abortController = new AbortController();

    setIsFreePolicyFilterBootstrapLoading(true);
    setFreePolicyFiltersError(null);

    void (async () => {
      try {
        const filters = await fetchFreePolicyFilters({
          endDate,
          profile: freePolicyProfile,
          signal: abortController.signal,
          startDate,
        });
        const savedFilters = savedReportFiltersRef.current;
        const shouldDefaultCountries = shouldPreferDefaultStoredSelection(
          savedFilters?.useDefaultCountries,
          {
            assumeDefaultWhenMissing: activeQuoteProfile === "total-quote",
          },
        );
        const nextCountries = restoreStoredSelectionValues(
          savedFilters?.countries,
          filters.countries,
          {
            preferFallback: shouldDefaultCountries,
          },
        );

        let nextBrandOptions = filters.brands;
        let nextPetTypeOptions = filters.petTypes;

        if (!areSameValueLists(nextCountries, getFilterOptionValues(filters.countries))) {
          const countryScopedFilters = await fetchFreePolicyFilters({
            countryCodes: nextCountries,
            endDate,
            profile: freePolicyProfile,
            signal: abortController.signal,
            startDate,
          });
          nextBrandOptions = countryScopedFilters.brands;
          nextPetTypeOptions = countryScopedFilters.petTypes;
        }

        const shouldDefaultBrands = shouldPreferDefaultStoredSelection(
          savedFilters?.useDefaultBrands,
          {
            assumeDefaultWhenMissing: activeQuoteProfile === "total-quote",
          },
        );
        const nextBrands = restoreStoredSelectionValues(
          savedFilters?.brands,
          nextBrandOptions,
          {
            preferFallback: shouldDefaultBrands,
          },
        );

        if (!areSameValueLists(nextBrands, getFilterOptionValues(nextBrandOptions))) {
          const petTypeScopedFilters = await fetchFreePolicyFilters({
            brands: nextBrands,
            countryCodes: nextCountries,
            endDate,
            profile: freePolicyProfile,
            signal: abortController.signal,
            startDate,
          });
          nextPetTypeOptions = petTypeScopedFilters.petTypes;
        }

        const nextPetTypes = restoreStoredSelectionValues(
          savedFilters?.petTypes,
          nextPetTypeOptions,
          {
            fallbackValues: getDefaultQuotePetTypeValues(
              activeQuoteProfile,
              nextPetTypeOptions,
            ),
            treatFullSelectionAsDefault: true,
          },
        );

        if (abortController.signal.aborted) {
          return;
        }

        startTransition(() => {
          setFreePolicyFilterOptions({
            brands: nextBrandOptions,
            countries: filters.countries,
            petTypes: nextPetTypeOptions,
          });
          setSelectedCountries(nextCountries);
          setSelectedBrands(nextBrands);
          setSelectedPetTypes(nextPetTypes);
        });
        setIsFilterStateReady(true);
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        startTransition(() => {
          setFreePolicyFilterOptions(emptyFreePolicyFilterOptions);
          setSelectedCountries([]);
          setSelectedBrands([]);
          setSelectedPetTypes([]);
        });
        setFreePolicyFiltersError(
          error instanceof Error
            ? error.message
            : "Failed to load free policy filters.",
        );
        setIsFilterStateReady(true);
      } finally {
        if (!abortController.signal.aborted) {
          setIsFreePolicyFilterBootstrapLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [
    activeFilterModal?.profile,
    freePolicyEtlDataRevision,
    isFreePolicyReportActive,
    reportingPeriod,
  ]);

  useEffect(() => {
    if (!isQuoteTypeModalOpen || activeFilterModal) {
      setIsQuoteReportOptionsLoading(false);
      setQuoteReportOptionsError(null);
      setAvailableQuoteReportOptions(quoteReportOptionDefinitions);
      return;
    }

    const [startDate, endDate] = reportingPeriod;
    if (!startDate || !endDate) {
      setAvailableQuoteReportOptions(quoteReportOptionDefinitions);
      return;
    }

    const abortController = new AbortController();

    setIsQuoteReportOptionsLoading(true);
    setQuoteReportOptionsError(null);

    void fetchQuoteReportProfiles({
      endDate,
      signal: abortController.signal,
      startDate,
    })
      .then((payload) => {
        const nextOptions = buildQuoteReportOptions(payload.profiles);

        startTransition(() => {
          setAvailableQuoteReportOptions(
            nextOptions.length ? nextOptions : quoteReportOptionDefinitions,
          );
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        startTransition(() => {
          setAvailableQuoteReportOptions(quoteReportOptionDefinitions);
        });
        setQuoteReportOptionsError(
          error instanceof Error
            ? error.message
            : "Failed to load quote report availability.",
        );
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsQuoteReportOptionsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [
    activeFilterModal,
    isQuoteTypeModalOpen,
    quoteEtlDataRevision,
    reportingPeriod,
  ]);

  useEffect(() => {
    const [startDate, endDate] = reportingPeriod;

    if (!isQuoteReportActive || !activeQuoteProfile || !startDate || !endDate) {
      quoteBrandRequestRef.current?.abort();
      quotePetTypeRequestRef.current?.abort();
      setQuoteFilterOptions(emptyQuoteFilterOptions);
      setAvailableQuoteExportColumns([]);
      setSelectedQuoteExportColumns([]);
      setDraggedQuoteExportColumn(null);
      setQuoteExportDropTarget(null);
      previousQuoteExportColumnsRef.current = [];
      hasCustomizedQuoteExportColumnsRef.current = false;
      hasQuoteFilterBootstrapCompletedRef.current = false;
      setIsQuoteFilterBootstrapLoading(false);
      setIsQuoteBrandOptionsLoading(false);
      setIsQuotePetTypeOptionsLoading(false);
      setIsQuoteExportColumnsLoading(false);
      setQuoteFiltersError(null);
      return;
    }

    quoteBrandRequestRef.current?.abort();
    quotePetTypeRequestRef.current?.abort();

    const abortController = new AbortController();

    setIsQuoteFilterBootstrapLoading(true);
    setQuoteFiltersError(null);

    void (async () => {
      try {
        const filters = await fetchQuoteReportFilters({
          endDate,
          profile: activeQuoteProfile,
          signal: abortController.signal,
          startDate,
        });
        const savedFilters = savedReportFiltersRef.current;
        const nextCountries = restoreStoredSelectionValues(
          savedFilters?.countries,
          filters.countries,
        );

        let nextBrandOptions = filters.brands;
        let nextPetTypeOptions = filters.petTypes;

        if (!areSameValueLists(nextCountries, getFilterOptionValues(filters.countries))) {
          const countryScopedFilters = await fetchQuoteReportFilters({
            countryCodes: nextCountries,
            endDate,
            profile: activeQuoteProfile,
            signal: abortController.signal,
            startDate,
          });
          nextBrandOptions = countryScopedFilters.brands;
          nextPetTypeOptions = countryScopedFilters.petTypes;
        }

        const nextBrands = restoreStoredSelectionValues(
          savedFilters?.brands,
          nextBrandOptions,
        );

        if (!areSameValueLists(nextBrands, getFilterOptionValues(nextBrandOptions))) {
          const petTypeScopedFilters = await fetchQuoteReportFilters({
            brands: nextBrands,
            countryCodes: nextCountries,
            endDate,
            profile: activeQuoteProfile,
            signal: abortController.signal,
            startDate,
          });
          nextPetTypeOptions = petTypeScopedFilters.petTypes;
        }

        const visiblePetTypeOptions = getVisibleQuotePetTypeOptions(
          activeQuoteProfile,
          nextPetTypeOptions,
        );
        const shouldDefaultPetTypes = shouldPreferDefaultStoredSelection(
          savedFilters?.useDefaultPetTypes,
          {
            assumeDefaultWhenMissing: activeQuoteProfile === "total-quote",
          },
        );

        const nextPetTypes = restoreStoredSelectionValues(
          savedFilters?.petTypes,
          visiblePetTypeOptions,
          {
            fallbackValues: getDefaultQuotePetTypeValues(
              activeQuoteProfile,
              visiblePetTypeOptions,
            ),
            preferFallback: shouldDefaultPetTypes,
            treatFullSelectionAsDefault: true,
          },
        );

        if (abortController.signal.aborted) {
          return;
        }

        startTransition(() => {
          setQuoteFilterOptions({
            brands: nextBrandOptions,
            countries: filters.countries,
            petTypes: visiblePetTypeOptions,
          });
          setSelectedCountries(nextCountries);
          setSelectedBrands(nextBrands);
          setSelectedPetTypes(nextPetTypes);
        });
        hasQuoteFilterBootstrapCompletedRef.current = true;
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        startTransition(() => {
          setQuoteFilterOptions(emptyQuoteFilterOptions);
          setSelectedCountries([]);
          setSelectedBrands([]);
          setSelectedPetTypes([]);
        });
        hasQuoteFilterBootstrapCompletedRef.current = false;
        setQuoteFiltersError(
          error instanceof Error ? error.message : "Failed to load quote filters.",
        );
        setIsFilterStateReady(true);
      } finally {
        if (!abortController.signal.aborted) {
          setIsQuoteFilterBootstrapLoading(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [
    activeQuoteProfile,
    isQuoteReportActive,
    quoteEtlDataRevision,
    reportingPeriod,
  ]);

  useEffect(() => {
    const activeQuoteProfile = activeReport?.id as QuoteReportProfile | undefined;
    if (!isQuoteReportActive || !activeQuoteProfile) {
      setAvailableQuoteExportColumns([]);
      setSelectedQuoteExportColumns([]);
      setDraggedQuoteExportColumn(null);
      setQuoteExportDropTarget(null);
      previousQuoteExportColumnsRef.current = [];
      hasCustomizedQuoteExportColumnsRef.current = false;
      setIsQuoteExportColumnsLoading(false);
      return;
    }

    if (!hasQuoteFilterBootstrapCompletedRef.current || isQuoteFilterBootstrapLoading) {
      setIsQuoteExportColumnsLoading(false);
      return;
    }

    const [startDate, endDate] = reportingPeriod;
    if (!startDate || !endDate) {
      setAvailableQuoteExportColumns([]);
      setSelectedQuoteExportColumns([]);
      setDraggedQuoteExportColumn(null);
      setQuoteExportDropTarget(null);
      previousQuoteExportColumnsRef.current = [];
      hasCustomizedQuoteExportColumnsRef.current = false;
      setIsQuoteExportColumnsLoading(false);
      return;
    }

    const abortController = new AbortController();

    setIsQuoteExportColumnsLoading(true);
    setQuoteFiltersError(null);

    void fetchQuoteReportColumns({
      brands: selectedBrands,
      endDate,
      petTypes: selectedPetTypes,
      profile: activeQuoteProfile,
      signal: abortController.signal,
      startDate,
    })
      .then((payload) => {
        const nextAvailableValues = getFilterOptionValues(payload.columns);

        startTransition(() => {
          setAvailableQuoteExportColumns(payload.columns);
          setSelectedQuoteExportColumns((currentValues) =>
            hasCustomizedQuoteExportColumnsRef.current
              ? reconcileOrderedSelectedValues(
                  currentValues,
                  payload.columns,
                  previousQuoteExportColumnsRef.current,
                )
              : nextAvailableValues,
          );
        });
        previousQuoteExportColumnsRef.current = nextAvailableValues;
        setIsFilterStateReady(true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        startTransition(() => {
          setAvailableQuoteExportColumns([]);
          setSelectedQuoteExportColumns([]);
        });
        setDraggedQuoteExportColumn(null);
        setQuoteExportDropTarget(null);
        previousQuoteExportColumnsRef.current = [];
        hasCustomizedQuoteExportColumnsRef.current = false;
        setQuoteFiltersError(
          error instanceof Error
            ? error.message
            : "Failed to load quote export columns.",
        );
        setIsFilterStateReady(true);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsQuoteExportColumnsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [
    activeReport?.id,
    isQuoteFilterBootstrapLoading,
    isQuoteReportActive,
    reportingPeriod,
    selectedBrands,
    selectedPetTypes,
  ]);

  useEffect(() => {
    if (!activeFilterModal || !activeReportStorageKey || !isFilterStateReady) {
      return;
    }

    const availableCountryOptions = isLiveClaimsReportActive
      ? claimsCountryOptions
      : isLivePaidPolicyReportActive
        ? activePolicyCountryOptions
        : isQuoteReportActive
        ? quoteFilterOptions.countries
        : isFreePolicyReportActive
          ? freePolicyFilterOptions.countries
          : staticCountrySelectOptions;
    const availableBrandOptions = isLiveClaimsReportActive
      ? claimsBrandOptions
      : isLivePaidPolicyReportActive
        ? activePolicyBrandOptions
        : isQuoteReportActive
        ? quoteFilterOptions.brands
        : isFreePolicyReportActive
          ? freePolicyFilterOptions.brands
          : staticBrandSelectOptions;
    const availablePetTypeOptions = isLiveClaimsReportActive
      ? claimsPetTypeOptions
      : isLivePaidPolicyReportActive
        ? activePolicyPetTypeOptions
        : isQuoteReportActive
        ? quoteFilterOptions.petTypes
        : isFreePolicyReportActive
          ? freePolicyFilterOptions.petTypes
          : staticPetTypeSelectOptions;
    const countryStorage = serializeStoredSelectionValues(
      selectedCountries,
      availableCountryOptions,
    );
    const brandStorage = serializeStoredSelectionValues(
      selectedBrands,
      availableBrandOptions,
    );
    const petTypeStorage = serializeStoredSelectionValues(
      selectedPetTypes,
      availablePetTypeOptions,
      {
        defaultValues: isQuoteReportActive
          ? getDefaultQuotePetTypeValues(
              activeQuoteProfile,
              availablePetTypeOptions,
            )
          : undefined,
      },
    );
    const nextStoredFilters: StoredReportFilters = {
      brands: brandStorage.values,
      countries: countryStorage.values,
      petTypes: petTypeStorage.values,
      useDefaultBrands: brandStorage.useDefaultSelection,
      useDefaultCountries: countryStorage.useDefaultSelection,
      useDefaultPetTypes: petTypeStorage.useDefaultSelection,
    };

    if (isQuoteReportActive) {
      const quoteStatusStorage = serializeStoredSelectionValues(
        selectedQuoteStatuses,
        quoteStatusOptions,
      );
      nextStoredFilters.existingClient = selectedExistingClient;
      nextStoredFilters.isFreeProduct = selectedIsFreeProduct;
      nextStoredFilters.quoteStatuses = quoteStatusStorage.values;
      nextStoredFilters.receivedSource = selectedReceivedSource;
      nextStoredFilters.sendDocumentOnEmail = selectedSendDocumentOnEmail;
      nextStoredFilters.useDefaultQuoteStatuses =
        quoteStatusStorage.useDefaultSelection;
    }

    if (isQuoteReportActive) {
      nextStoredFilters.isQuoteExportColumnsVisible =
        isQuoteExportColumnsVisible;
      nextStoredFilters.quoteExportColumns = selectedQuoteExportColumns;
    }

    writeStoredReportFilters(activeReportStorageKey, nextStoredFilters);
  }, [
    activeFilterModal,
    activeQuoteProfile,
    activeReportStorageKey,
    freePolicyFilterOptions,
    isLiveClaimsReportActive,
    isLivePaidPolicyReportActive,
    isFilterStateReady,
    isFreePolicyReportActive,
    isQuoteExportColumnsVisible,
    isQuoteReportActive,
    quoteFilterOptions,
    reportingPeriod,
    selectedBrands,
    selectedCountries,
    selectedExistingClient,
    selectedIsFreeProduct,
    selectedPetTypes,
    selectedQuoteExportColumns,
    selectedQuoteStatuses,
    selectedReceivedSource,
    selectedSendDocumentOnEmail,
  ]);

  const handleCountrySelectionChange = (nextCountries: string[]) => {
    setFeedbackMessage(null);

    if (!isFreePolicyReportActive) {
      if (!isQuoteReportActive) {
        setSelectedCountries(nextCountries);
        return;
      }

      setSelectedCountries(nextCountries);
      setQuoteFiltersError(null);
      quoteBrandRequestRef.current?.abort();
      quotePetTypeRequestRef.current?.abort();

      if (!nextCountries.length) {
        setIsQuoteBrandOptionsLoading(false);
        setIsQuotePetTypeOptionsLoading(false);
        startTransition(() => {
          setQuoteFilterOptions((currentOptions) => ({
            ...currentOptions,
            brands: [],
            petTypes: [],
          }));
          setSelectedBrands([]);
          setSelectedPetTypes([]);
        });
        return;
      }

      const [startDate, endDate] = reportingPeriod;
      if (!activeQuoteProfile || !startDate || !endDate) {
        return;
      }

      const quoteAbortController = new AbortController();
      quoteBrandRequestRef.current = quoteAbortController;
      quotePetTypeRequestRef.current = quoteAbortController;
      setIsQuoteBrandOptionsLoading(true);
      setIsQuotePetTypeOptionsLoading(true);

      void (async () => {
        try {
          const brandScopedFilters = await fetchQuoteReportFilters({
            countryCodes: nextCountries,
            endDate,
            profile: activeQuoteProfile,
            signal: quoteAbortController.signal,
            startDate,
          });

          const availableBrandValues = getFilterOptionValues(
            brandScopedFilters.brands,
          );
          const nextSelectedBrands = reconcileOrderedSelectedValues(
            selectedBrands,
            brandScopedFilters.brands,
            getFilterOptionValues(quoteFilterOptions.brands),
          );

          let nextPetTypeOptions = brandScopedFilters.petTypes;

          if (
            nextSelectedBrands.length &&
            !areSameValueSets(nextSelectedBrands, availableBrandValues)
          ) {
            const petTypeScopedFilters = await fetchQuoteReportFilters({
              brands: nextSelectedBrands,
              countryCodes: nextCountries,
              endDate,
              profile: activeQuoteProfile,
              signal: quoteAbortController.signal,
              startDate,
            });
            nextPetTypeOptions = petTypeScopedFilters.petTypes;
          }

          const visiblePetTypeOptions = getVisibleQuotePetTypeOptions(
            activeQuoteProfile,
            nextPetTypeOptions,
          );

          if (quoteAbortController.signal.aborted) {
            return;
          }

          startTransition(() => {
            setQuoteFilterOptions((currentOptions) => ({
              brands: brandScopedFilters.brands,
              countries:
                currentOptions.countries.length > 0
                  ? currentOptions.countries
                  : brandScopedFilters.countries,
              petTypes: visiblePetTypeOptions,
            }));
            setSelectedBrands(nextSelectedBrands);
            setSelectedPetTypes((currentValues) =>
              reconcileOrderedSelectedValues(
                currentValues,
                visiblePetTypeOptions,
                getFilterOptionValues(quoteFilterOptions.petTypes),
                getDefaultQuotePetTypeValues(
                  activeQuoteProfile,
                  visiblePetTypeOptions,
                ),
              ),
            );
          });
        } catch (error: unknown) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          setQuoteFiltersError(
            error instanceof Error
              ? error.message
              : "Failed to refresh quote brands.",
          );
        } finally {
          if (quoteBrandRequestRef.current === quoteAbortController) {
            quoteBrandRequestRef.current = null;
          }
          if (quotePetTypeRequestRef.current === quoteAbortController) {
            quotePetTypeRequestRef.current = null;
          }
          if (!quoteAbortController.signal.aborted) {
            setIsQuoteBrandOptionsLoading(false);
            setIsQuotePetTypeOptionsLoading(false);
          }
        }
      })();

      return;
    }

    setSelectedCountries(nextCountries);
    setFreePolicyFiltersError(null);
    freePolicyBrandRequestRef.current?.abort();
    freePolicyPetTypeRequestRef.current?.abort();

    if (!nextCountries.length) {
      setIsFreePolicyBrandOptionsLoading(false);
      setIsFreePolicyPetTypeOptionsLoading(false);
      startTransition(() => {
        setFreePolicyFilterOptions((currentOptions) => ({
          ...currentOptions,
          brands: [],
          petTypes: [],
        }));
        setSelectedBrands([]);
        setSelectedPetTypes([]);
      });
      return;
    }

    const [startDate, endDate] = reportingPeriod;
    const freePolicyProfile = activeFilterModal?.profile;
    if (!freePolicyProfile || !startDate || !endDate) {
      return;
    }

    const abortController = new AbortController();
    freePolicyBrandRequestRef.current = abortController;
    freePolicyPetTypeRequestRef.current = abortController;
    setIsFreePolicyBrandOptionsLoading(true);
    setIsFreePolicyPetTypeOptionsLoading(true);

    void (async () => {
      try {
        const brandScopedFilters = await fetchFreePolicyFilters({
          countryCodes: nextCountries,
          endDate,
          profile: freePolicyProfile,
          signal: abortController.signal,
          startDate,
        });

        const availableBrandValues = getFilterOptionValues(
          brandScopedFilters.brands,
        );
        const nextSelectedBrands = reconcileOrderedSelectedValues(
          selectedBrands,
          brandScopedFilters.brands,
          getFilterOptionValues(freePolicyFilterOptions.brands),
        );

        let nextPetTypeOptions = brandScopedFilters.petTypes;

        if (
          nextSelectedBrands.length &&
          !areSameValueSets(nextSelectedBrands, availableBrandValues)
        ) {
          const petTypeScopedFilters = await fetchFreePolicyFilters({
            brands: nextSelectedBrands,
            countryCodes: nextCountries,
            endDate,
            profile: freePolicyProfile,
            signal: abortController.signal,
            startDate,
          });
          nextPetTypeOptions = petTypeScopedFilters.petTypes;
        }

        if (abortController.signal.aborted) {
          return;
        }

        startTransition(() => {
          setFreePolicyFilterOptions((currentOptions) => ({
            brands: brandScopedFilters.brands,
            countries:
              currentOptions.countries.length > 0
                ? currentOptions.countries
                : brandScopedFilters.countries,
            petTypes: nextPetTypeOptions,
          }));
          setSelectedBrands(nextSelectedBrands);
          setSelectedPetTypes((currentValues) =>
            reconcileOrderedSelectedValues(
              currentValues,
              nextPetTypeOptions,
              getFilterOptionValues(freePolicyFilterOptions.petTypes),
              getDefaultQuotePetTypeValues(
                activeQuoteProfile,
                nextPetTypeOptions,
              ),
            ),
          );
        });
      } catch (error: unknown) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setFreePolicyFiltersError(
          error instanceof Error
            ? error.message
            : "Failed to refresh free policy brands.",
        );
      } finally {
        if (freePolicyBrandRequestRef.current === abortController) {
          freePolicyBrandRequestRef.current = null;
        }
        if (freePolicyPetTypeRequestRef.current === abortController) {
          freePolicyPetTypeRequestRef.current = null;
        }
        if (!abortController.signal.aborted) {
          setIsFreePolicyBrandOptionsLoading(false);
          setIsFreePolicyPetTypeOptionsLoading(false);
        }
      }
    })();
  };

  const handleBrandSelectionChange = (nextBrands: string[]) => {
    setFeedbackMessage(null);

    if (!isFreePolicyReportActive) {
      if (!isQuoteReportActive) {
        setSelectedBrands(nextBrands);
        return;
      }

      setSelectedBrands(nextBrands);
      setQuoteFiltersError(null);
      quotePetTypeRequestRef.current?.abort();

      if (!nextBrands.length) {
        setIsQuotePetTypeOptionsLoading(false);
        startTransition(() => {
          setQuoteFilterOptions((currentOptions) => ({
            ...currentOptions,
            petTypes: [],
          }));
          setSelectedPetTypes([]);
        });
        return;
      }

      const [startDate, endDate] = reportingPeriod;
      if (!activeQuoteProfile || !startDate || !endDate) {
        return;
      }

      const quoteAbortController = new AbortController();
      quotePetTypeRequestRef.current = quoteAbortController;
      setIsQuotePetTypeOptionsLoading(true);

      void fetchQuoteReportFilters({
        brands: nextBrands,
        countryCodes: selectedCountries,
        endDate,
        profile: activeQuoteProfile,
        signal: quoteAbortController.signal,
        startDate,
      })
        .then((filters) => {
          const visiblePetTypeOptions = getVisibleQuotePetTypeOptions(
            activeQuoteProfile,
            filters.petTypes,
          );

          startTransition(() => {
            setQuoteFilterOptions((currentOptions) => ({
              ...currentOptions,
              petTypes: visiblePetTypeOptions,
            }));
            setSelectedPetTypes((currentValues) =>
              reconcileOrderedSelectedValues(
                currentValues,
                visiblePetTypeOptions,
                getFilterOptionValues(quoteFilterOptions.petTypes),
                getDefaultQuotePetTypeValues(
                  activeQuoteProfile,
                  visiblePetTypeOptions,
                ),
              ),
            );
          });
        })
        .catch((error: unknown) => {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          setQuoteFiltersError(
            error instanceof Error
              ? error.message
              : "Failed to refresh quote pet types.",
          );
        })
        .finally(() => {
          if (quotePetTypeRequestRef.current === quoteAbortController) {
            quotePetTypeRequestRef.current = null;
          }
          if (!quoteAbortController.signal.aborted) {
            setIsQuotePetTypeOptionsLoading(false);
          }
        });

      return;
    }

    setSelectedBrands(nextBrands);
    setFreePolicyFiltersError(null);
    freePolicyPetTypeRequestRef.current?.abort();

    if (!nextBrands.length) {
      setIsFreePolicyPetTypeOptionsLoading(false);
      startTransition(() => {
        setFreePolicyFilterOptions((currentOptions) => ({
          ...currentOptions,
          petTypes: [],
        }));
        setSelectedPetTypes([]);
      });
      return;
    }

    const [startDate, endDate] = reportingPeriod;
    const freePolicyProfile = activeFilterModal?.profile;
    if (!freePolicyProfile || !startDate || !endDate) {
      return;
    }

    const abortController = new AbortController();
    freePolicyPetTypeRequestRef.current = abortController;
    setIsFreePolicyPetTypeOptionsLoading(true);

    void fetchFreePolicyFilters({
      brands: nextBrands,
      countryCodes: selectedCountries,
      endDate,
      profile: freePolicyProfile,
      signal: abortController.signal,
      startDate,
    })
      .then((filters) => {
        startTransition(() => {
          setFreePolicyFilterOptions((currentOptions) => ({
            ...currentOptions,
            petTypes: filters.petTypes,
          }));
          setSelectedPetTypes((currentValues) =>
            reconcileOrderedSelectedValues(
              currentValues,
              filters.petTypes,
              getFilterOptionValues(freePolicyFilterOptions.petTypes),
              getDefaultQuotePetTypeValues(activeQuoteProfile, filters.petTypes),
            ),
          );
        });
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setFreePolicyFiltersError(
          error instanceof Error
            ? error.message
            : "Failed to refresh free policy pet types.",
        );
      })
      .finally(() => {
        if (freePolicyPetTypeRequestRef.current === abortController) {
          freePolicyPetTypeRequestRef.current = null;
        }
        if (!abortController.signal.aborted) {
          setIsFreePolicyPetTypeOptionsLoading(false);
        }
      });
  };

  const handlePetTypeSelectionChange = (nextPetTypes: string[]) => {
    setFeedbackMessage(null);
    if (isQuoteReportActive) {
      setQuoteFiltersError(null);
    }
    setSelectedPetTypes(nextPetTypes);
  };

  const handleIsFreeProductChange = (value: QuoteBinaryFilterValue) => {
    setFeedbackMessage(null);
    setQuoteFiltersError(null);
    setSelectedIsFreeProduct(value);
  };

  const handleSendDocumentOnEmailChange = (value: QuoteBinaryFilterValue) => {
    setFeedbackMessage(null);
    setQuoteFiltersError(null);
    setSelectedSendDocumentOnEmail(value);
  };

  const handleExistingClientChange = (value: QuoteBinaryFilterValue) => {
    setFeedbackMessage(null);
    setQuoteFiltersError(null);
    setSelectedExistingClient(value);
  };

  const handleQuoteStatusSelectionChange = (nextStatuses: string[]) => {
    setFeedbackMessage(null);
    setQuoteFiltersError(null);
    setSelectedQuoteStatuses(nextStatuses);
  };

  const handleReceivedSourceChange = (value: QuoteReceivedSourceValue) => {
    setFeedbackMessage(null);
    setQuoteFiltersError(null);
    setSelectedReceivedSource(value);
  };

  const handleQuoteExportColumnSelectionChange = (nextColumns: string[]) => {
    setFeedbackMessage(null);
    setQuoteFiltersError(null);
    hasCustomizedQuoteExportColumnsRef.current = true;
    setSelectedQuoteExportColumns((currentValues) =>
      mergeOrderedSelectedValues(
        currentValues,
        nextColumns,
        availableQuoteExportColumns,
      ),
    );
  };

  const handleQuoteExportColumnsVisibilityToggle = () => {
    setFeedbackMessage(null);
    setQuoteFiltersError(null);
    setIsQuoteExportColumnsVisible((currentValue) => !currentValue);
  };

  const handleQuoteExportColumnDragStart = (
    event: DragEvent<HTMLButtonElement>,
    value: string,
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", value);
    setDraggedQuoteExportColumn(value);
    setQuoteExportDropTarget(value);
  };

  const handleQuoteExportColumnDragOver = (
    event: DragEvent<HTMLElement>,
    targetValue: string | "end",
  ) => {
    if (!draggedQuoteExportColumn) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (quoteExportDropTarget !== targetValue) {
      setQuoteExportDropTarget(targetValue);
    }
  };

  const handleQuoteExportColumnDrop = (
    event: DragEvent<HTMLElement>,
    targetValue: string | "end",
  ) => {
    event.preventDefault();
    const draggedValue =
      draggedQuoteExportColumn || event.dataTransfer.getData("text/plain");
    if (!draggedValue) {
      return;
    }

    setFeedbackMessage(null);
    setQuoteFiltersError(null);
    hasCustomizedQuoteExportColumnsRef.current = true;
    setSelectedQuoteExportColumns((currentValues) =>
      moveSelectedValue(currentValues, draggedValue, targetValue),
    );
    setDraggedQuoteExportColumn(null);
    setQuoteExportDropTarget(null);
  };

  const handleQuoteExportColumnDragEnd = () => {
    setDraggedQuoteExportColumn(null);
    setQuoteExportDropTarget(null);
  };

  const handleReportCardClick = (report: ReportDefinition) => {
    resetFilters();
    if (report.id === "free-policy") {
      setIsFreePolicyTypeModalOpen(true);
      return;
    }

    setActiveFilterModal({
      badgeLabel: report.modalBadgeLabel ?? report.scope,
      description: report.description,
      profile: null,
      reportId: report.id,
      title: report.modalTitle ?? report.label,
    });
  };

  const handleQuoteLibraryClick = () => {
    resetFilters();
    setIsClaimsTypeModalOpen(false);
    setIsQuoteTypeModalOpen(true);
    setIsPolicyTypeModalOpen(false);
    setIsPaidPolicyTypeModalOpen(false);
    setIsFreePolicyTypeModalOpen(false);
    setActiveFilterModal(null);
  };

  const handlePolicyLibraryClick = () => {
    resetFilters();
    setIsClaimsTypeModalOpen(false);
    setIsPolicyTypeModalOpen(true);
    setIsPaidPolicyTypeModalOpen(false);
    setIsFreePolicyTypeModalOpen(false);
    setIsQuoteTypeModalOpen(false);
    setActiveFilterModal(null);
  };

  const handleClaimsLibraryClick = () => {
    resetFilters();
    setIsPolicyTypeModalOpen(false);
    setIsPaidPolicyTypeModalOpen(false);
    setIsFreePolicyTypeModalOpen(false);
    setIsQuoteTypeModalOpen(false);
    setIsClaimsTypeModalOpen(true);
    setActiveFilterModal(null);
  };

  const handleClaimsTypeClick = (reportId: ClaimsReportProfile) => {
    const option = claimsReportOptions.find(
      (entry) => entry.reportId === reportId,
    );
    if (!option) {
      return;
    }

    resetFilters();
    setIsClaimsTypeModalOpen(false);
    if (reportId === "claims-data") {
      setReportingPeriod(getLastTwelveMonthsReportingPeriod());
    }
    setSelectedCountries([...allClaimsCountryValues]);
    setSelectedBrands([...allClaimsBrandValues]);
    setSelectedPetTypes([...allClaimsPetTypeValues]);
    setActiveFilterModal({
      badgeLabel: "Claims",
      description: option.description,
      profile: null,
      reportId: option.reportId,
      title: option.label,
    });
  };

  const handlePolicyLibraryTypeClick = (
    value: PolicyLibraryOption["value"],
  ) => {
    resetFilters();

    if (value === "free-policy") {
      setIsPaidPolicyTypeModalOpen(false);
      setIsFreePolicyTypeModalOpen(true);
      return;
    }

    setIsFreePolicyTypeModalOpen(false);
    setIsPaidPolicyTypeModalOpen(true);
  };

  const handleFreePolicyTypeClick = (profile: FreePolicyOutputProfile) => {
    const option = freePolicyProfileOptions.find(
      (entry) => entry.value === profile,
    );
    if (!option) {
      return;
    }

    resetFilters();
    setActiveFilterModal({
      badgeLabel: "Policy",
      description: option.description,
      profile,
      reportId: "free-policy",
      title: option.label,
    });
  };

  const handleQuoteTypeClick = (reportId: QuoteReportProfile) => {
    const option = availableQuoteReportOptions.find(
      (entry) => entry.reportId === reportId,
    );
    if (!option) {
      return;
    }

    resetFilters();
    setActiveFilterModal({
      badgeLabel: "Quote",
      description: option.description,
      profile: null,
      reportId: option.reportId,
      title: option.label,
    });
  };

  const handlePaidPolicyTypeClick = (reportId: ReportId) => {
    const option = paidPolicyReportOptions.find(
      (entry) => entry.reportId === reportId,
    );
    if (!option) {
      return;
    }

    resetFilters();
    if (isLivePaidPolicyReportProfile(reportId)) {
      setSelectedCountries([...allActivePolicyCountryValues]);
      setSelectedBrands([...allActivePolicyBrandValues]);
      setSelectedPetTypes([...allActivePolicyPetTypeValues]);
    }
    setActiveFilterModal({
      badgeLabel: "Policy",
      description: option.description,
      profile: null,
      reportId: option.reportId,
      title: option.label,
    });
  };

  const handleDownload = async () => {
    if (!activeReport || !activeFilterModal || !canDownload) {
      return;
    }

    const [start, end] = reportingPeriod;
    if (!start || !end) {
      return;
    }

    setIsDownloadInProgress(true);
    setFeedbackMessage(`Downloading ${reportModalTitle}...`);

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    if (activeReport.id === "free-policy" && activeFilterModal.profile) {
      try {
        await downloadFreePolicyReport({
          brands: selectedBrands,
          countryCodes: selectedCountries,
          endDate: end,
          petTypes: selectedPetTypes,
          profile: activeFilterModal.profile,
          startDate: start,
        });
        setFeedbackMessage(`Downloaded ${reportModalTitle}.`);
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error
            ? error.message
            : `Failed to download ${reportModalTitle}.`,
        );
      } finally {
        setIsDownloadInProgress(false);
      }
      return;
    }

    if (isLiveClaimsReportActive) {
      try {
        await downloadClaimsReport({
          brands: selectedBrands,
          countryCodes: selectedCountries,
          endDate: end,
          petTypes: selectedPetTypes,
          profile: claimsReportProfile!,
          startDate: start,
        });
        setFeedbackMessage(`Downloaded ${reportModalTitle}.`);
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error
            ? error.message
            : `Failed to download ${reportModalTitle}.`,
        );
      } finally {
        setIsDownloadInProgress(false);
      }
      return;
    }
    if (isLivePaidPolicyReportActive) {
      try {
        await downloadPaidPolicyReport({
          brands: selectedBrands,
          countryCodes: selectedCountries,
          endDate:
            paidPolicyReportProfile === "active-policy" ? undefined : end,
          petTypes: selectedPetTypes,
          profile: paidPolicyReportProfile!,
          startDate:
            paidPolicyReportProfile === "active-policy" ? undefined : start,
        });
        setFeedbackMessage(`Downloaded ${reportModalTitle}.`);
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error
            ? error.message
            : `Failed to download ${reportModalTitle}.`,
        );
      } finally {
        setIsDownloadInProgress(false);
      }
      return;
    }

    if (isQuoteReportActive) {
      try {
        await downloadQuoteReport({
          brands: selectedBrands,
          countryCodes: selectedCountries,
          endDate: end,
          existingClient: selectedExistingClient,
          isFreeProduct: selectedIsFreeProduct,
          petTypes: selectedPetTypes,
          profile: activeReport.id as QuoteReportProfile,
          quoteStatuses: selectedQuoteStatuses,
          receivedSource: selectedReceivedSource,
          selectedColumns: selectedQuoteExportColumns,
          sendDocumentOnEmail: selectedSendDocumentOnEmail,
          startDate: start,
        });
        setFeedbackMessage(`Downloaded ${reportModalTitle}.`);
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error
            ? error.message
            : `Failed to download ${reportModalTitle}.`,
        );
      } finally {
        setIsDownloadInProgress(false);
      }
      return;
    }

    try {
      const rows = activeReport.buildRows({
        brands: selectedBrands,
        countries: selectedCountries,
        dateRange: reportingPeriod,
        petTypes: selectedPetTypes,
      });
      const csvRows = rows.map((row) =>
        activeReport.columns
          .map((column) => csvEscape(row[column] ?? ""))
          .join(","),
      );
      const csv = [
        activeReport.columns.map(csvEscape).join(","),
        ...csvRows,
      ].join("\n");
      const fileNameSuffix = activeFilterModal.profile
        ? `_${activeFilterModal.profile.replace(/-/g, "_")}`
        : "";
      const fileName = `${activeReport.fileStem}${fileNameSuffix}_${start ?? "start"}_${end ?? "end"}.csv`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setFeedbackMessage(`Downloaded ${reportModalTitle}.`);
    } finally {
      setIsDownloadInProgress(false);
    }
  };

  const handleDownloadRequest = () => {
    if (isLiveSourceReportActive) {
      setFeedbackMessage(null);
      setIsActivePolicyConfirmationOpen(true);
      return;
    }

    void handleDownload();
  };

  const confirmActivePolicyDownload = () => {
    setIsActivePolicyConfirmationOpen(false);
    void handleDownload();
  };

  return (
    <>
      <DashboardLayout
        downloadAriaLabel="Download report"
        downloadDisabled
        headerProfile={
          <DashboardProfileMenu
            activeCurrencyCode={"GBP" as PremiumCurrencyCode}
            activeMetricKey={"totalQuote" as TrendSeriesKey}
            availableBrands={brandFilterOptions}
            availableCountries={countryFilterOptions}
            availableCurrencies={currencyFilterOptions}
            availableMetrics={metricFilterOptions}
            availablePetTypes={petTypeFilterOptions}
            firstName={firstName}
            isEtlRunning={etlRunner.isEtlRunning}
            lastName={lastName}
            onActiveCurrencyChange={() => undefined}
            onActiveMetricChange={() => undefined}
            onBrandsChange={() => undefined}
            onCountriesChange={() => undefined}
            onManageUsers={() => navigate("/manage_users")}
            onLogout={logout}
            onPetTypesChange={() => undefined}
            onRunEtl={etlRunner.openModal}
            selectedBrands={[]}
            selectedCountries={[]}
            selectedPetTypes={[]}
            showFilterControls={false}
            showManageUsersControl={isAdmin}
            showRunEtlControl={isAdmin}
          />
        }
        menuItems={dashboardMenuItems}
        showReportingPeriodControl={false}
        title="Reports"
      >
        <div className={style.root}>
        <div className={style.libraryPage}>
          <div className={style.libraryHero}>
            <div className={style.libraryHeroCopy}>
              <p className={style.eyebrow}>Report Library</p>
              <h2 className={style.libraryTitle}>
                Choose a report to download
              </h2>
              <p className={style.libraryCopy}>
                Select a report card, choose the filters you need, and download
                the extract directly.
              </p>
            </div>
          </div>

          <div className={style.reportGrid}>
            {standaloneLibraryReports.map((report) => {
              const ReportIcon = report.icon || RiFileTextLine;

              return (
                <button
                  className={style.reportCard}
                  key={report.id}
                  onClick={() => handleReportCardClick(report)}
                  type="button"
                >
                  <span className={style.reportCardIcon}>
                    <ReportIcon />
                  </span>

                  <div className={style.reportCardBody}>
                    <span
                      className={`${style.reportScopeBadge} ${getScopeClassName(
                        report.scope,
                      )}`}
                    >
                      {report.scope}
                    </span>
                    <strong className={style.reportCardTitle}>
                      {report.libraryLabel ?? report.label}
                    </strong>
                    <span className={style.reportCardDescription}>
                      {report.libraryDescription ?? report.description}
                    </span>
                  </div>
                </button>
              );
            })}

            <button
              className={style.reportCard}
              onClick={handleClaimsLibraryClick}
              type="button"
            >
              <span className={style.reportCardIcon}>
                <RiFileTextLine />
              </span>

              <div className={style.reportCardBody}>
                <span
                  className={`${style.reportScopeBadge} ${style.reportScopeClaims}`}
                >
                  Claims
                </span>
                <strong className={style.reportCardTitle}>
                  Claims Report
                </strong>
                <span className={style.reportCardDescription}>
                  Turnaround time and monthly claims data reports across the
                  selected regions.
                </span>
              </div>
            </button>

            <button
              className={style.reportCard}
              onClick={handlePolicyLibraryClick}
              type="button"
            >
              <span className={style.reportCardIcon}>
                <RiShieldCheckLine />
              </span>

              <div className={style.reportCardBody}>
                <span
                  className={`${style.reportScopeBadge} ${style.reportScopePolicy}`}
                >
                  Policy
                </span>
                <strong className={style.reportCardTitle}>
                  Policy Reports
                </strong>
                <span className={style.reportCardDescription}>
                  Free policy and paid policy exports in one grouped flow.
                </span>
              </div>
            </button>

            <button
              className={style.reportCard}
              onClick={handleQuoteLibraryClick}
              type="button"
            >
              <span className={style.reportCardIcon}>
                <RiLineChartLine />
              </span>

              <div className={style.reportCardBody}>
                <span
                  className={`${style.reportScopeBadge} ${style.reportScopeQuote}`}
                >
                  Quote
                </span>
                <strong className={style.reportCardTitle}>Quote Reports</strong>
                <span className={style.reportCardDescription}>
                  Converted, pending, and lapsed quote exports in one grouped
                  flow.
                </span>
              </div>
            </button>
          </div>
        </div>


        {isClaimsTypeModalOpen && !activeFilterModal ? (
          <div className={style.modalOverlay} onClick={closeClaimsTypeModal}>
            <div
              aria-labelledby="claims-type-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.selectionModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Claims Report</p>
                  <h3 className={style.modalTitle} id="claims-type-modal-title">
                    Choose claims report
                  </h3>
                  <p className={style.modalDescription}>
                    Select the claims export you want before choosing filters.
                  </p>
                </div>

                <button
                  aria-label="Close claims report type modal"
                  className={style.closeButton}
                  onClick={closeClaimsTypeModal}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.policyTypeGrid}>
                {claimsReportOptions.map((option) => (
                  <button
                    className={style.policyTypeCard}
                    key={option.reportId}
                    onClick={() =>
                      handleClaimsTypeClick(
                        option.reportId as ClaimsReportProfile,
                      )
                    }
                    type="button"
                  >
                    <span className={style.policyTypeTag}>Claims</span>
                    <strong className={style.policyTypeCardTitle}>
                      {option.label}
                    </strong>
                    <span className={style.policyTypeCardDescription}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {isFreePolicyTypeModalOpen && !activeFilterModal ? (
          <div className={style.modalOverlay} onClick={closeFreePolicyTypeModal}>
            <div
              aria-labelledby="free-policy-type-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.selectionModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Free Policy</p>
                  <h3
                    className={style.modalTitle}
                    id="free-policy-type-modal-title"
                  >
                    Choose policy type
                  </h3>
                  <p className={style.modalDescription}>
                    Select the exact free-policy extract you want before
                    choosing filters.
                  </p>
                </div>

                <button
                  aria-label="Close free policy type modal"
                  className={style.closeButton}
                  onClick={closeFreePolicyTypeModal}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.policyTypeGrid}>
                {freePolicyProfileOptions.map((option) => (
                  <button
                    className={style.policyTypeCard}
                    key={option.value}
                    onClick={() => handleFreePolicyTypeClick(option.value)}
                    type="button"
                  >
                    <span className={style.policyTypeTag}>Free Policy</span>
                    <strong className={style.policyTypeCardTitle}>
                      {option.label}
                    </strong>
                    <span className={style.policyTypeCardDescription}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {isPaidPolicyTypeModalOpen && !activeFilterModal ? (
          <div className={style.modalOverlay} onClick={closePaidPolicyTypeModal}>
            <div
              aria-labelledby="paid-policy-type-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.selectionModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Paid Policy</p>
                  <h3
                    className={style.modalTitle}
                    id="paid-policy-type-modal-title"
                  >
                    Choose policy type
                  </h3>
                  <p className={style.modalDescription}>
                    Select the paid-policy extract you want before choosing
                    filters.
                  </p>
                </div>

                <button
                  aria-label="Close paid policy type modal"
                  className={style.closeButton}
                  onClick={closePaidPolicyTypeModal}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.policyTypeGrid}>
                {paidPolicyReportOptions.map((option) => (
                  <button
                    className={style.policyTypeCard}
                    key={option.reportId}
                    onClick={() => handlePaidPolicyTypeClick(option.reportId)}
                    type="button"
                  >
                    <span className={style.policyTypeTag}>Paid Policy</span>
                    <strong className={style.policyTypeCardTitle}>
                      {option.label}
                    </strong>
                    <span className={style.policyTypeCardDescription}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {isPolicyTypeModalOpen &&
        !isPaidPolicyTypeModalOpen &&
        !isFreePolicyTypeModalOpen &&
        !activeFilterModal ? (
          <div className={style.modalOverlay} onClick={closePolicyLibraryModal}>
            <div
              aria-labelledby="policy-type-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.selectionModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Policy Reports</p>
                  <h3 className={style.modalTitle} id="policy-type-modal-title">
                    Choose policy report
                  </h3>
                  <p className={style.modalDescription}>
                    Select the policy extract you want before choosing filters.
                  </p>
                </div>

                <button
                  aria-label="Close policy report type modal"
                  className={style.closeButton}
                  onClick={closePolicyLibraryModal}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.policyTypeGrid}>
                {policyLibraryOptions.map((option) => (
                  <button
                    className={style.policyTypeCard}
                    key={option.value}
                    onClick={() => handlePolicyLibraryTypeClick(option.value)}
                    type="button"
                  >
                    <span className={style.policyTypeTag}>Policy</span>
                    <strong className={style.policyTypeCardTitle}>
                      {option.label}
                    </strong>
                    <span className={style.policyTypeCardDescription}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {isQuoteTypeModalOpen && !activeFilterModal ? (
          <div className={style.modalOverlay} onClick={closeQuoteTypeModal}>
            <div
              aria-labelledby="quote-type-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.selectionModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Quote Reports</p>
                  <h3 className={style.modalTitle} id="quote-type-modal-title">
                    Choose quote report
                  </h3>
                  <p className={style.modalDescription}>
                    Select the quote extract you want before choosing filters.
                  </p>
                  {quoteReportOptionsError ? (
                    <p className={style.formHint}>{quoteReportOptionsError}</p>
                  ) : isQuoteReportOptionsLoading ? (
                    <p className={style.formHint}>
                      Checking current month-to-date quote report availability.
                    </p>
                  ) : null}
                </div>

                <button
                  aria-label="Close quote report type modal"
                  className={style.closeButton}
                  onClick={closeQuoteTypeModal}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.policyTypeGrid}>
                {availableQuoteReportOptions.map((option) => (
                  <button
                    className={style.policyTypeCard}
                    key={option.reportId}
                    onClick={() => handleQuoteTypeClick(option.reportId)}
                    type="button"
                  >
                    <span className={style.policyTypeTag}>Quote</span>
                    <strong className={style.policyTypeCardTitle}>
                      {option.label}
                    </strong>
                    <span className={style.policyTypeCardDescription}>
                      {option.description}
                    </span>
                    {typeof option.rowCount === "number" ? (
                      <span className={style.policyTypeCardMeta}>
                        {option.rowCount === 0
                          ? "0 rows in month to date. You can widen the reporting period after selecting."
                          : `${option.rowCount.toLocaleString()} ${option.rowCount === 1 ? "row" : "rows"} in month to date`}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeFilterModal && activeReport ? (
          <div className={style.modalOverlay} onClick={closeFilterModal}>
            <div
              aria-labelledby="report-filter-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.filterModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <div className={style.modalBadgeRow}>
                    <span
                      className={`${style.reportScopeBadge} ${getScopeClassName(
                        activeReport.scope,
                      )}`}
                    >
                      {activeFilterModal.badgeLabel}
                    </span>
                    {activeFilterModal.profile ? (
                      <span className={style.modalSecondaryBadge}>
                        {activeReport.label}
                      </span>
                    ) : null}
                  </div>
                  <h3
                    className={style.modalTitle}
                    id="report-filter-modal-title"
                  >
                    {reportModalTitle}
                  </h3>
                  <p className={style.modalDescription}>
                    {activeFilterModal.description}
                  </p>
                </div>

                <button
                  aria-label="Close report filter modal"
                  className={style.closeButton}
                  onClick={closeFilterModal}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.formIntro}>
                <p className={style.formHint}>
                  All filter groups start selected by default. Refine only what
                  you need, then download the report.
                </p>
                {isFreePolicyReportActive && freePolicyFiltersError ? (
                  <span className={style.feedbackText}>
                    {freePolicyFiltersError}
                  </span>
                ) : null}
                {isQuoteReportActive && quoteFiltersError ? (
                  <span className={style.feedbackText}>
                    {quoteFiltersError}
                  </span>
                ) : null}
              </div>

              <div className={style.filterGrid}>
                {!isActivePolicyReportActive ? (
                  <div className={`${style.fieldGroup} ${style.fieldGroupWide}`}>
                    <span className={style.fieldLabel}>Reporting Period</span>
                    <ReportingPeriodPicker
                      ariaLabel={`${reportModalTitle} reporting period`}
                      clearable
                      modalTitle={`Select ${reportModalTitle} reporting period`}
                      onChange={setReportingPeriod}
                      placeholder="Select a date or range"
                      value={reportingPeriod}
                      zIndex={3000}
                    />
                  </div>
                ) : null}

                {isQuoteReportActive ? (
                  <div className={style.quoteFilterColumns}>
                    <div className={style.quoteFilterColumn}>
                      <div className={style.fieldGroup}>
                        <SelectAllFieldLabel
                          disabled={isCountrySelectionDisabled}
                          label="Country"
                          onChange={handleCountrySelectionChange}
                          options={countryOptionsData}
                          selectedValues={selectedCountries}
                        />
                        <MultiSelect
                          aria-label="Select countries"
                          clearable
                          comboboxProps={{
                            shadow: "md",
                            withinPortal: true,
                            zIndex: 2600,
                          }}
                          data={countryOptionsData}
                          disabled={isCountrySelectionDisabled}
                          nothingFoundMessage={
                            isQuoteFilterBootstrapLoading
                              ? "Loading countries..."
                              : "No country found"
                          }
                          onChange={handleCountrySelectionChange}
                          placeholder="Select countries"
                          searchable
                          styles={countrySelectionInputStyles}
                          value={selectedCountries}
                        />
                      </div>

                      <div className={style.fieldGroup}>
                        <SelectAllFieldLabel
                          disabled={isPetTypeSelectionDisabled}
                          label="Pet Type"
                          onChange={handlePetTypeSelectionChange}
                          options={petTypeOptionsData}
                          selectedValues={selectedPetTypes}
                        />
                        <MultiSelect
                          aria-label="Select pet types"
                          clearable
                          comboboxProps={{
                            shadow: "md",
                            withinPortal: true,
                            zIndex: 2600,
                          }}
                          data={petTypeOptionsData}
                          disabled={isPetTypeSelectionDisabled}
                          nothingFoundMessage={
                            isQuoteFilterBootstrapLoading ||
                            isQuotePetTypeOptionsLoading
                              ? "Loading pet types..."
                              : "No pet type found"
                          }
                          onChange={handlePetTypeSelectionChange}
                          placeholder="Select pet types"
                          searchable
                          styles={petTypeSelectionInputStyles}
                          value={selectedPetTypes}
                        />
                      </div>

                      <div className={style.fieldGroup}>
                        <SelectAllFieldLabel
                          label="Quote Status"
                          onChange={handleQuoteStatusSelectionChange}
                          options={quoteStatusOptions}
                          selectedValues={selectedQuoteStatuses}
                        />
                        <MultiSelect
                          aria-label="Select quote statuses"
                          clearable
                          comboboxProps={{
                            shadow: "md",
                            withinPortal: true,
                            zIndex: 2600,
                          }}
                          data={quoteStatusOptions}
                          onChange={handleQuoteStatusSelectionChange}
                          placeholder="Select quote statuses"
                          searchable
                          styles={quoteFlagSelectionInputStyles}
                          value={selectedQuoteStatuses}
                        />
                      </div>

                      {isQuoteReportActive ? (
                        <div className={style.fieldGroup}>
                          <div className={style.inlineFieldHeader}>
                            <span className={style.fieldLabel}>Export Columns</span>
                            <div className={style.inlineFieldActions}>
                              {isQuoteExportColumnsVisible ? (
                                <SelectAllFieldLabel
                                  disabled={isQuoteExportColumnSelectionDisabled}
                                  label="Export Columns"
                                  onChange={handleQuoteExportColumnSelectionChange}
                                  options={availableQuoteExportColumns}
                                  selectedValues={selectedQuoteExportColumns}
                                  showLabel={false}
                                />
                              ) : null}
                              <button
                                className={style.fieldToggleButton}
                                onClick={handleQuoteExportColumnsVisibilityToggle}
                                type="button"
                              >
                                {isQuoteExportColumnsVisible ? "Hide" : "Customize"}
                              </button>
                            </div>
                          </div>
                          <span className={style.quoteExportSummary}>
                            {quoteExportSummaryText}
                          </span>
                          {isQuoteExportColumnsVisible ? (
                            <>
                              <MultiSelect
                                aria-label="Select export columns"
                                clearable
                                comboboxProps={{
                                  shadow: "md",
                                  withinPortal: true,
                                  zIndex: 2600,
                                }}
                                data={availableQuoteExportColumns}
                                disabled={isQuoteExportColumnSelectionDisabled}
                                nothingFoundMessage={
                                  isQuoteExportColumnsLoading
                                    ? "Loading columns..."
                                    : "No export column found"
                                }
                                onChange={handleQuoteExportColumnSelectionChange}
                                placeholder="Select export columns"
                                searchable
                                styles={quoteFlagSelectionInputStyles}
                                value={selectedQuoteExportColumns}
                              />
                              {selectedQuoteExportColumns.length ? (
                                <>
                                  <span className={style.quoteExportOrderHint}>
                                    Drag the selected columns below to control the
                                    export order.
                                  </span>
                                  <div className={style.quoteExportOrderList}>
                                    {selectedQuoteExportColumns.map((columnValue) => {
                                      const columnLabel =
                                        quoteExportColumnLabelMap.get(columnValue) ||
                                        columnValue;

                                      return (
                                        <button
                                          aria-grabbed={
                                            draggedQuoteExportColumn === columnValue
                                          }
                                          className={`${style.quoteExportOrderItem}${
                                            draggedQuoteExportColumn === columnValue
                                              ? ` ${style.quoteExportOrderItemDragging}`
                                              : ""
                                          }${
                                            quoteExportDropTarget === columnValue &&
                                            draggedQuoteExportColumn !== columnValue
                                              ? ` ${style.quoteExportOrderItemTarget}`
                                              : ""
                                          }`}
                                          draggable
                                          key={columnValue}
                                          onDragEnd={handleQuoteExportColumnDragEnd}
                                          onDragOver={(event) =>
                                            handleQuoteExportColumnDragOver(
                                              event,
                                              columnValue,
                                            )
                                          }
                                          onDragStart={(event) =>
                                            handleQuoteExportColumnDragStart(
                                              event,
                                              columnValue,
                                            )
                                          }
                                          onDrop={(event) =>
                                            handleQuoteExportColumnDrop(
                                              event,
                                              columnValue,
                                            )
                                          }
                                          title={columnLabel}
                                          type="button"
                                        >
                                          <span className={style.quoteExportOrderLabel}>
                                            {columnLabel}
                                          </span>
                                        </button>
                                      );
                                    })}
                                    {selectedQuoteExportColumns.length > 1 ? (
                                      <div
                                        className={`${style.quoteExportOrderDropZone}${
                                          quoteExportDropTarget === "end"
                                            ? ` ${style.quoteExportOrderDropZoneActive}`
                                            : ""
                                        }`}
                                        onDragOver={(event) =>
                                          handleQuoteExportColumnDragOver(event, "end")
                                        }
                                        onDrop={(event) =>
                                          handleQuoteExportColumnDrop(event, "end")
                                        }
                                      >
                                        Drop here to move to the end
                                      </div>
                                    ) : null}
                                  </div>
                                </>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    <div className={style.quoteFilterColumn}>
                      <div className={style.fieldGroup}>
                        <SelectAllFieldLabel
                          disabled={isBrandSelectionDisabled}
                          label="Brand"
                          onChange={handleBrandSelectionChange}
                          options={brandOptionsData}
                          selectedValues={selectedBrands}
                        />
                        <MultiSelect
                          aria-label="Select brands"
                          clearable
                          comboboxProps={{
                            shadow: "md",
                            withinPortal: true,
                            zIndex: 2600,
                          }}
                          data={brandOptionsData}
                          disabled={isBrandSelectionDisabled}
                          nothingFoundMessage={
                            isQuoteFilterBootstrapLoading ||
                            isQuoteBrandOptionsLoading
                              ? "Loading brands..."
                              : "No brand found"
                          }
                          onChange={handleBrandSelectionChange}
                          placeholder="Select brands"
                          searchable
                          styles={brandSelectionInputStyles}
                          value={selectedBrands}
                        />
                      </div>

                      <div className={style.fieldGroup}>
                        <span className={style.fieldLabel}>Free Product</span>
                        <SegmentedTabs
                          accentRgb="95, 158, 132"
                          activeKey={selectedIsFreeProduct}
                          ariaLabel="Select free product filter"
                          className={style.segmentedFieldControl}
                          onChange={handleIsFreeProductChange}
                          options={quoteFreeProductPillOptions}
                        />
                      </div>

                      <div className={style.fieldGroup}>
                        <span className={style.fieldLabel}>Document Delivery</span>
                        <SegmentedTabs
                          accentRgb="154, 120, 184"
                          activeKey={selectedSendDocumentOnEmail}
                          ariaLabel="Select document delivery filter"
                          className={style.segmentedFieldControl}
                          onChange={handleSendDocumentOnEmailChange}
                          options={quoteDocumentDeliveryPillOptions}
                        />
                      </div>

                      <div className={style.fieldGroup}>
                        <span className={style.fieldLabel}>Client Type</span>
                        <SegmentedTabs
                          accentRgb="108, 117, 186"
                          activeKey={selectedExistingClient}
                          ariaLabel="Select client type filter"
                          className={style.segmentedFieldControl}
                          onChange={handleExistingClientChange}
                          options={quoteClientTypePillOptions}
                        />
                      </div>

                      <div className={style.fieldGroup}>
                        <span className={style.fieldLabel}>Quote Source</span>
                        <SegmentedTabs
                          accentRgb="167, 126, 97"
                          activeKey={selectedReceivedSource}
                          ariaLabel="Select quote source filter"
                          className={style.segmentedFieldControl}
                          onChange={handleReceivedSourceChange}
                          options={quoteReceivedSourcePillOptions}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={style.fieldGroup}>
                      <SelectAllFieldLabel
                        disabled={isCountrySelectionDisabled}
                        label="Country"
                        onChange={handleCountrySelectionChange}
                        options={countryOptionsData}
                        selectedValues={selectedCountries}
                      />
                      <MultiSelect
                        aria-label="Select countries"
                        clearable
                        comboboxProps={{
                          shadow: "md",
                          withinPortal: true,
                          zIndex: 2600,
                        }}
                        data={countryOptionsData}
                        disabled={isCountrySelectionDisabled}
                        nothingFoundMessage={
                          (isFreePolicyReportActive &&
                            isFreePolicyFilterBootstrapLoading) ||
                          (isQuoteReportActive && isQuoteFilterBootstrapLoading)
                            ? "Loading countries..."
                            : "No country found"
                        }
                        onChange={handleCountrySelectionChange}
                        placeholder="Select countries"
                        searchable
                        styles={countrySelectionInputStyles}
                        value={selectedCountries}
                      />
                    </div>

                    <div className={style.fieldGroup}>
                      <SelectAllFieldLabel
                        disabled={isBrandSelectionDisabled}
                        label="Brand"
                        onChange={handleBrandSelectionChange}
                        options={brandOptionsData}
                        selectedValues={selectedBrands}
                      />
                      <MultiSelect
                        aria-label="Select brands"
                        clearable
                        comboboxProps={{
                          shadow: "md",
                          withinPortal: true,
                          zIndex: 2600,
                        }}
                        data={brandOptionsData}
                        disabled={isBrandSelectionDisabled}
                        nothingFoundMessage={
                          (isFreePolicyReportActive &&
                            (isFreePolicyFilterBootstrapLoading ||
                              isFreePolicyBrandOptionsLoading)) ||
                          (isQuoteReportActive &&
                            (isQuoteFilterBootstrapLoading ||
                              isQuoteBrandOptionsLoading))
                            ? "Loading brands..."
                            : "No brand found"
                        }
                        onChange={handleBrandSelectionChange}
                        placeholder="Select brands"
                        searchable
                        styles={brandSelectionInputStyles}
                        value={selectedBrands}
                      />
                    </div>

                    <div className={style.fieldGroup}>
                      <SelectAllFieldLabel
                        disabled={isPetTypeSelectionDisabled}
                        label="Pet Type"
                        onChange={handlePetTypeSelectionChange}
                        options={petTypeOptionsData}
                        selectedValues={selectedPetTypes}
                      />
                      <MultiSelect
                        aria-label="Select pet types"
                        clearable
                        comboboxProps={{
                          shadow: "md",
                          withinPortal: true,
                          zIndex: 2600,
                        }}
                        data={petTypeOptionsData}
                        disabled={isPetTypeSelectionDisabled}
                        nothingFoundMessage={
                          (isFreePolicyReportActive &&
                            (isFreePolicyFilterBootstrapLoading ||
                              isFreePolicyPetTypeOptionsLoading)) ||
                          (isQuoteReportActive &&
                            (isQuoteFilterBootstrapLoading ||
                              isQuotePetTypeOptionsLoading))
                            ? "Loading pet types..."
                            : "No pet type found"
                        }
                        onChange={handlePetTypeSelectionChange}
                        placeholder="Select pet types"
                        searchable
                        styles={petTypeSelectionInputStyles}
                        value={selectedPetTypes}
                      />
                    </div>
                  </>
                )}
              </div>

              {feedbackMessage ? (
                <span className={style.feedbackText}>{feedbackMessage}</span>
              ) : null}

              <div className={style.modalActions}>
                <button
                  className={style.secondaryAction}
                  onClick={closeFilterModal}
                  type="button"
                >
                  Close
                </button>
                <button
                  className={style.primaryAction}
                  disabled={!canDownload || isDownloadInProgress}
                  onClick={handleDownloadRequest}
                  type="button"
                >
                  {isDownloadInProgress ? (
                    <RiLoader4Line className={style.loadingIcon} />
                  ) : (
                    <RiDownloadCloud2Line />
                  )}
                  {isDownloadInProgress ? "Downloading..." : "Download Report"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isActivePolicyConfirmationOpen && isLiveSourceReportActive ? (
          <div
            className={`${style.modalOverlay} ${style.confirmationOverlay}`}
            onClick={closeActivePolicyConfirmation}
          >
            <div
              aria-describedby="active-policy-confirmation-description"
              aria-labelledby="active-policy-confirmation-title"
              aria-modal="true"
              className={`${style.modal} ${style.confirmationModal}`}
              onClick={(event) => event.stopPropagation()}
              role="alertdialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Live Source Query</p>
                  <h3
                    className={style.modalTitle}
                    id="active-policy-confirmation-title"
                  >
                    Run {reportModalTitle} export?
                  </h3>
                  <p
                    className={style.modalDescription}
                    id="active-policy-confirmation-description"
                  >
                    This report reads current source data directly from every
                    selected regional server and may take several minutes.
                  </p>
                </div>

                <button
                  aria-label={`Cancel ${reportModalTitle} export`}
                  className={style.closeButton}
                  onClick={closeActivePolicyConfirmation}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.confirmationNotice}>
                <span className={style.confirmationIcon}>
                  <RiDatabase2Line />
                </span>
                <div>
                  <strong>Direct database operation</strong>
                  <p>
                    Continue only when you are ready to query the selected
                    source systems and generate the combined Excel workbook.
                  </p>
                </div>
              </div>

              <div className={style.confirmationSummary}>
                <div>
                  <span>Snapshot scope</span>
                  <strong>{liveReportSnapshotScope}</strong>
                </div>
                <div>
                  <span>Source servers</span>
                  <strong>{selectedLiveReportRegions.length}</strong>
                </div>
              </div>

              <div
                aria-label={`Selected ${reportModalTitle} regions`}
                className={style.confirmationRegions}
              >
                {selectedLiveReportRegions.map((region) => (
                  <span className={style.confirmationRegion} key={region.value}>
                    {region.value}
                    <small>{region.label}</small>
                  </span>
                ))}
              </div>

              <div className={style.modalActions}>
                <button
                  className={style.secondaryAction}
                  onClick={closeActivePolicyConfirmation}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={`${style.primaryAction} ${style.confirmationAction}`}
                  onClick={confirmActivePolicyDownload}
                  type="button"
                >
                  <RiDatabase2Line />
                  Query {selectedLiveReportRegions.length}
                  {selectedLiveReportRegions.length === 1
                    ? " Server"
                    : " Servers"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        </div>
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

export default Reports;


