import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import { MultiSelect } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  RiCloseLine,
  RiDownloadCloud2Line,
  RiFileTextLine,
  RiLineChartLine,
  RiLoader4Line,
  RiShieldCheckLine,
} from "react-icons/ri";
import DashboardLayout, {
  type DashboardDateRange,
} from "../components/layout/DashboardLayout/DashboardLayout";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import V2EtlModal from "../components/ui/etl_modal/V2EtlModal";
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
  downloadFreePolicyReport,
  fetchFreePolicyFilters,
  type FreePolicyFilterOption,
  type FreePolicyOutputProfile,
} from "../services/freePolicyV2";
import { useAuth } from "../context/AuthContext";
import { useV2EtlRunner } from "../features/etl/useV2EtlRunner";
import { getUserNameParts } from "../utils/auth";
import { getReportingPeriodPresets } from "../utils/reportingPeriodPresets";
import style from "./page_css/Reports.module.css";

type ReportId =
  | "debtors"
  | "claims"
  | "free-policy"
  | "converted-quotes"
  | "converted-policy"
  | "active-policy"
  | "cancelled-policy"
  | "expired-policy"
  | "pending-policy"
  | "refer-policy"
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
  reportId: ReportId;
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

const defaultDateRange: DashboardDateRange = [
  dayjs().startOf("month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD"),
];

const freePolicyProfileOptions: FreePolicyProfileOption[] = [
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

const quoteReportOptions: QuoteReportOption[] = [
  {
    description:
      "Quoted business that converted, with premium movement across the chosen period.",
    label: "Converted Quotes",
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
];

const policyLibraryOptions: PolicyLibraryOption[] = [
  {
    description:
      "Free-policy access and effective-date movement across the selected regions.",
    label: "Free Policy",
    value: "free-policy",
  },
  {
    description:
      "Converted, active, cancelled, expired, pending, and referred policy exports grouped under paid policy.",
    label: "Paid Policy",
    value: "paid-policy",
  },
];

const paidPolicyReportOptions: PolicyReportOption[] = [
  {
    description:
      "Active policies by market, brand, and pet type, with renewal timing included.",
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
      "Referred policies with referral reason, review status, and pricing context.",
    label: "Refer Policy",
    reportId: "refer-policy",
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

const getFilterOptionValues = (options: FreePolicyFilterOption[]) =>
  options.map((option) => option.value);

const areSameValueLists = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((value, index) => value === right[index]);

const reconcileSelectedValues = (
  selectedValues: string[],
  availableOptions: FreePolicyFilterOption[],
) => {
  const availableValues = new Set(getFilterOptionValues(availableOptions));
  const intersectedValues = selectedValues.filter((value) =>
    availableValues.has(value),
  );
  const dedupedIntersectedValues = Array.from(new Set(intersectedValues));
  const nextValues = dedupedIntersectedValues.length
    ? dedupedIntersectedValues
    : getFilterOptionValues(availableOptions);

  return areSameValueLists(selectedValues, nextValues)
    ? selectedValues
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
      "Claim Date",
      "Claim Status",
      "Claim Value",
    ],
    description:
      "Claim-level result extract with status, claim date, and value across selected regions.",
    fileStem: "claims_report",
    icon: RiFileTextLine,
    id: "claims",
    libraryLabel: "Claims Reports",
    label: "Claims",
    scope: "Claims",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Claim Number",
          "Country",
          "Brand",
          "Pet Type",
          "Claim Date",
          "Claim Status",
          "Claim Value",
        ],
        (index, values) => ({
          Brand: values.brand,
          "Claim Date": values.date,
          "Claim Number": `CL-${9200 + index}`,
          "Claim Status":
            index % 3 === 0 ? "Open" : index % 3 === 1 ? "In Review" : "Closed",
          "Claim Value": formatCurrencyAmount(180 + index * 54),
          Country: values.country,
          "Pet Type": values.petType,
        }),
      ),
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
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Referral Date",
      "Referral Reason",
      "Review Status",
    ],
    description:
      "Referred policies with referral reason, review status, and pricing context.",
    fileStem: "refer_policy",
    icon: RiShieldCheckLine,
    id: "refer-policy",
    label: "Refer Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Referral Date",
          "Referral Reason",
          "Review Status",
        ],
        (index, values) => ({
          Brand: values.brand,
          Country: values.country,
          "Pet Type": values.petType,
          "Policy Number": `RP-${4900 + index}`,
          "Referral Date": values.date,
          "Referral Reason":
            index % 3 === 0
              ? "Breed rule"
              : index % 3 === 1
                ? "Claims history"
                : "Manual underwriting",
          "Review Status": index % 2 === 0 ? "In review" : "Awaiting decision",
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
      "Quoted business that converted, with premium movement across the chosen period.",
    fileStem: "converted_quotes",
    icon: RiLineChartLine,
    id: "converted-quotes",
    label: "Converted Quotes",
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
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Activation Date",
      "Policy Status",
      "Annual Premium",
    ],
    description:
      "Converted policies with status, activation date, and premium ready for export.",
    fileStem: "converted_policy",
    icon: RiShieldCheckLine,
    id: "converted-policy",
    label: "Converted Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Activation Date",
          "Policy Status",
          "Annual Premium",
        ],
        (index, values) => ({
          "Activation Date": values.date,
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
      "Active policies by market, brand, and pet type, with renewal timing included.",
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

const datePickerStyles = {
  dropdown: {
    backdropFilter: "blur(20px)",
    background:
      "linear-gradient(180deg, rgba(43, 46, 60, 0.98), rgba(35, 38, 51, 0.98))",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(107, 99, 117, 0.18)",
    borderRadius: "1rem",
    color: "var(--text-h)",
    fontSize: "0.92rem",
    fontWeight: 600,
    height: "3.15rem",
  },
  label: {
    display: "none",
  },
  section: {
    color: "var(--text)",
  },
} as const;

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, logout, user } = useAuth();
  const isMobile = useMediaQuery("(max-width: 640px)") ?? false;
  const [isFreePolicyTypeModalOpen, setIsFreePolicyTypeModalOpen] =
    useState(false);
  const [isPolicyTypeModalOpen, setIsPolicyTypeModalOpen] = useState(false);
  const [isPaidPolicyTypeModalOpen, setIsPaidPolicyTypeModalOpen] =
    useState(false);
  const [isQuoteTypeModalOpen, setIsQuoteTypeModalOpen] = useState(false);
  const etlRunner = useV2EtlRunner();
  const [activeFilterModal, setActiveFilterModal] =
    useState<ReportFilterModalState | null>(null);
  const [reportingPeriod, setReportingPeriod] =
    useState<DashboardDateRange>(defaultDateRange);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    ...allCountryValues,
  ]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([
    ...allBrandValues,
  ]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([
    ...allPetTypeValues,
  ]);
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
  const standaloneLibraryReports = useMemo(
    () =>
      reportDefinitions.filter(
        (report) => report.id === "debtors" || report.id === "claims",
      ),
    [],
  );
  const countryOptionsData = isFreePolicyReportActive
    ? freePolicyFilterOptions.countries
    : staticCountrySelectOptions;
  const brandOptionsData = isFreePolicyReportActive
    ? freePolicyFilterOptions.brands
    : staticBrandSelectOptions;
  const petTypeOptionsData = isFreePolicyReportActive
    ? freePolicyFilterOptions.petTypes
    : staticPetTypeSelectOptions;
  const isFreePolicyFiltersBusy =
    isFreePolicyFilterBootstrapLoading ||
    isFreePolicyBrandOptionsLoading ||
    isFreePolicyPetTypeOptionsLoading;

  const canDownload = Boolean(
    activeReport &&
    reportingPeriod[0] &&
    reportingPeriod[1] &&
    selectedCountries.length &&
    selectedBrands.length &&
    selectedPetTypes.length &&
    (!isFreePolicyReportActive ||
      (!isFreePolicyFiltersBusy &&
        !freePolicyFiltersError &&
        countryOptionsData.length &&
        brandOptionsData.length &&
        petTypeOptionsData.length)),
  );
  const { firstName, lastName } = getUserNameParts(user);

  const resetFilters = () => {
    setReportingPeriod(defaultDateRange);
    setSelectedCountries([...allCountryValues]);
    setSelectedBrands([...allBrandValues]);
    setSelectedPetTypes([...allPetTypeValues]);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
    setIsFreePolicyBrandOptionsLoading(false);
    setIsFreePolicyPetTypeOptionsLoading(false);
  };

  const stopFreePolicyRequests = () => {
    freePolicyBrandRequestRef.current?.abort();
    freePolicyPetTypeRequestRef.current?.abort();
    setIsFreePolicyFilterBootstrapLoading(false);
    setIsFreePolicyBrandOptionsLoading(false);
    setIsFreePolicyPetTypeOptionsLoading(false);
  };

  const closePolicyLibraryModal = () => {
    setIsPolicyTypeModalOpen(false);
    setIsPaidPolicyTypeModalOpen(false);
    setIsFreePolicyTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
  };

  const closePaidPolicyTypeModal = () => {
    setIsPaidPolicyTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
  };

  const closeFreePolicyTypeModal = () => {
    stopFreePolicyRequests();
    setIsFreePolicyTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
  };

  const closeQuoteTypeModal = () => {
    setIsQuoteTypeModalOpen(false);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
  };

  const closeFilterModal = () => {
    stopFreePolicyRequests();
    setActiveFilterModal(null);
    setFeedbackMessage(null);
    setIsDownloadInProgress(false);
    setFreePolicyFiltersError(null);
  };

  const closeTopmostModal = () => {
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
      !isPolicyTypeModalOpen &&
      !isQuoteTypeModalOpen &&
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
    isFreePolicyTypeModalOpen,
    isPaidPolicyTypeModalOpen,
    isPolicyTypeModalOpen,
    isQuoteTypeModalOpen,
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

    const abortController = new AbortController();

    setIsFreePolicyFilterBootstrapLoading(true);
    setFreePolicyFiltersError(null);

    void fetchFreePolicyFilters({ signal: abortController.signal })
      .then((filters) => {
        startTransition(() => {
          setFreePolicyFilterOptions(filters);
          setSelectedCountries(getFilterOptionValues(filters.countries));
          setSelectedBrands(getFilterOptionValues(filters.brands));
          setSelectedPetTypes(getFilterOptionValues(filters.petTypes));
        });
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
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
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsFreePolicyFilterBootstrapLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [isFreePolicyReportActive, activeFilterModal?.profile]);

  const handleCountrySelectionChange = (nextCountries: string[]) => {
    setFeedbackMessage(null);

    if (!isFreePolicyReportActive) {
      setSelectedCountries(nextCountries);
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

    const abortController = new AbortController();
    freePolicyBrandRequestRef.current = abortController;
    freePolicyPetTypeRequestRef.current = abortController;
    setIsFreePolicyBrandOptionsLoading(true);
    setIsFreePolicyPetTypeOptionsLoading(true);

    void (async () => {
      try {
        const brandScopedFilters = await fetchFreePolicyFilters({
          countryCodes: nextCountries,
          signal: abortController.signal,
        });

        const availableBrandValues = getFilterOptionValues(
          brandScopedFilters.brands,
        );
        const nextSelectedBrands = reconcileSelectedValues(
          selectedBrands,
          brandScopedFilters.brands,
        );

        let nextPetTypeOptions = brandScopedFilters.petTypes;

        if (
          nextSelectedBrands.length &&
          !areSameValueLists(nextSelectedBrands, availableBrandValues)
        ) {
          const petTypeScopedFilters = await fetchFreePolicyFilters({
            brands: nextSelectedBrands,
            countryCodes: nextCountries,
            signal: abortController.signal,
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
            reconcileSelectedValues(currentValues, nextPetTypeOptions),
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
      setSelectedBrands(nextBrands);
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

    const abortController = new AbortController();
    freePolicyPetTypeRequestRef.current = abortController;
    setIsFreePolicyPetTypeOptionsLoading(true);

    void fetchFreePolicyFilters({
      brands: nextBrands,
      countryCodes: selectedCountries,
      signal: abortController.signal,
    })
      .then((filters) => {
        startTransition(() => {
          setFreePolicyFilterOptions((currentOptions) => ({
            ...currentOptions,
            petTypes: filters.petTypes,
          }));
          setSelectedPetTypes((currentValues) =>
            reconcileSelectedValues(currentValues, filters.petTypes),
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
    setSelectedPetTypes(nextPetTypes);
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
    setIsQuoteTypeModalOpen(true);
    setIsPolicyTypeModalOpen(false);
    setIsPaidPolicyTypeModalOpen(false);
    setIsFreePolicyTypeModalOpen(false);
    setActiveFilterModal(null);
  };

  const handlePolicyLibraryClick = () => {
    resetFilters();
    setIsPolicyTypeModalOpen(true);
    setIsPaidPolicyTypeModalOpen(false);
    setIsFreePolicyTypeModalOpen(false);
    setIsQuoteTypeModalOpen(false);
    setActiveFilterModal(null);
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

  const handleQuoteTypeClick = (reportId: ReportId) => {
    const option = quoteReportOptions.find(
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
    setFeedbackMessage(`Downloading ${activeFilterModal.title}...`);

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
        setFeedbackMessage(`Downloaded ${activeFilterModal.title}.`);
      } catch (error) {
        setFeedbackMessage(
          error instanceof Error
            ? error.message
            : `Failed to download ${activeFilterModal.title}.`,
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
      setFeedbackMessage(`Downloaded ${activeFilterModal.title}.`);
    } finally {
      setIsDownloadInProgress(false);
    }
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
                {quoteReportOptions.map((option) => (
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
                    {activeFilterModal.title}
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
              </div>

              <div className={style.filterGrid}>
                <div className={`${style.fieldGroup} ${style.fieldGroupWide}`}>
                  <span className={style.fieldLabel}>Reporting Period</span>
                  <DatePickerInput
                    aria-label={`Select ${activeFilterModal.title} reporting period`}
                    clearable
                    dropdownType={isMobile ? "modal" : "popover"}
                    onChange={setReportingPeriod}
                    placeholder="Select period"
                    popoverProps={{ withinPortal: true, zIndex: 2600 }}
                    presets={getReportingPeriodPresets()}
                    styles={datePickerStyles}
                    type="range"
                    value={reportingPeriod}
                    valueFormat="DD MMM YYYY"
                  />
                </div>

                <div className={style.fieldGroup}>
                  <span className={style.fieldLabel}>Country</span>
                  <MultiSelect
                    aria-label="Select countries"
                    clearable
                    comboboxProps={{
                      shadow: "md",
                      withinPortal: true,
                      zIndex: 2600,
                    }}
                    data={countryOptionsData}
                    disabled={
                      isFreePolicyReportActive &&
                      (isFreePolicyFilterBootstrapLoading ||
                        !countryOptionsData.length)
                    }
                    nothingFoundMessage={
                      isFreePolicyReportActive &&
                      isFreePolicyFilterBootstrapLoading
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
                  <span className={style.fieldLabel}>Brand</span>
                  <MultiSelect
                    aria-label="Select brands"
                    clearable
                    comboboxProps={{
                      shadow: "md",
                      withinPortal: true,
                      zIndex: 2600,
                    }}
                    data={brandOptionsData}
                    disabled={
                      isFreePolicyReportActive &&
                      (isFreePolicyFilterBootstrapLoading ||
                        isFreePolicyBrandOptionsLoading ||
                        !selectedCountries.length ||
                        !brandOptionsData.length)
                    }
                    nothingFoundMessage={
                      isFreePolicyReportActive &&
                      (isFreePolicyFilterBootstrapLoading ||
                        isFreePolicyBrandOptionsLoading)
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
                  <span className={style.fieldLabel}>Pet Type</span>
                  <MultiSelect
                    aria-label="Select pet types"
                    clearable
                    comboboxProps={{
                      shadow: "md",
                      withinPortal: true,
                      zIndex: 2600,
                    }}
                    data={petTypeOptionsData}
                    disabled={
                      isFreePolicyReportActive &&
                      (isFreePolicyFilterBootstrapLoading ||
                        isFreePolicyPetTypeOptionsLoading ||
                        !selectedBrands.length ||
                        !petTypeOptionsData.length)
                    }
                    nothingFoundMessage={
                      isFreePolicyReportActive &&
                      (isFreePolicyFilterBootstrapLoading ||
                        isFreePolicyPetTypeOptionsLoading)
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
                  onClick={handleDownload}
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
